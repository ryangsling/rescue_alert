import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  moderationSetCommentHidden,
  mergeDuplicateCases,
  redactCaseSensitiveInfo,
  correctCaseStatus,
  issueAccountRestriction,
  createModerationAppeal,
  reviewModerationAppeal,
  upsertAnimalType,
} from "../moderation";

function mockClient(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as unknown as SupabaseClient<Database>;
}

describe("moderationSetCommentHidden", () => {
  it("wraps moderation_set_comment_hidden with the expected arg shape", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await moderationSetCommentHidden(
      mockClient(rpc),
      "comment-1",
      true,
      "spam",
    );
    expect(rpc).toHaveBeenCalledWith("moderation_set_comment_hidden", {
      p_comment_id: "comment-1",
      p_hidden: true,
      p_reason: "spam",
    });
  });
});

describe("mergeDuplicateCases", () => {
  it("passes source, target, and reason through to merge_duplicate_cases", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await mergeDuplicateCases(mockClient(rpc), {
      sourceCaseId: "case-src",
      targetCaseId: "case-tgt",
      reason: "same incident",
    });
    expect(rpc).toHaveBeenCalledWith("merge_duplicate_cases", {
      p_source_case_id: "case-src",
      p_target_case_id: "case-tgt",
      p_reason: "same incident",
    });
  });
});

describe("redactCaseSensitiveInfo", () => {
  it("wraps redact_case_sensitive_info", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await redactCaseSensitiveInfo(mockClient(rpc), {
      caseId: "case-1",
      reason: "abuse case involving a person",
    });
    expect(rpc).toHaveBeenCalledWith("redact_case_sensitive_info", {
      p_case_id: "case-1",
      p_reason: "abuse case involving a person",
    });
  });
});

describe("correctCaseStatus", () => {
  it("stamps the actor from the caller, never the client payload", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await correctCaseStatus(mockClient(rpc), "mod-1", {
      caseId: "case-1",
      newStatus: "closed_by_moderator",
      reason: "corrected after review",
    });
    expect(rpc).toHaveBeenCalledWith("transition_case_status", {
      p_case_id: "case-1",
      p_new_status: "closed_by_moderator",
      p_actor_id: "mod-1",
      p_reason: "corrected after review",
    });
  });
});

describe("issueAccountRestriction", () => {
  it("wraps issue_account_restriction", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: "restriction-1", error: null });
    await issueAccountRestriction(mockClient(rpc), {
      userId: "user-1",
      restrictionType: "suspended",
      reason: "repeated spam",
    });
    expect(rpc).toHaveBeenCalledWith("issue_account_restriction", {
      p_user_id: "user-1",
      p_restriction_type: "suspended",
      p_reason: "repeated spam",
    });
  });
});

describe("createModerationAppeal", () => {
  it("stamps appellant_id from the caller, not the client payload", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await createModerationAppeal(client, "user-1", {
      restrictionId: "restriction-1",
      statement: "this was a mistake",
    });

    expect(insert).toHaveBeenCalledWith({
      restriction_id: "restriction-1",
      appellant_id: "user-1",
      statement: "this was a mistake",
    });
  });
});

describe("reviewModerationAppeal", () => {
  it("stamps reviewed_by and reviewed_at from the caller", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await reviewModerationAppeal(client, "mod-1", {
      appealId: "appeal-1",
      status: "overturned",
      decisionReason: "context checked out",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "overturned",
        reviewed_by: "mod-1",
        decision_reason: "context checked out",
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", "appeal-1");
  });
});

describe("upsertAnimalType", () => {
  it("upserts on slug so editing labels never creates a duplicate row", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const upsert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ upsert }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await upsertAnimalType(client, {
      slug: "dog",
      labelEn: "Dog",
      labelBn: "kukur",
      isActive: true,
      sortOrder: 1,
    });

    expect(upsert).toHaveBeenCalledWith(
      {
        slug: "dog",
        label_en: "Dog",
        label_bn: "kukur",
        is_active: true,
        sort_order: 1,
      },
      { onConflict: "slug" },
    );
  });
});
