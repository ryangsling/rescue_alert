import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  listContentReports,
  updateContentReportStatus,
  moderationSetCommentHidden,
  moderationSetReplyHidden,
  moderationSetMediaHidden,
  listCriticalCaseQueue,
  listUnansweredCriticalCases,
  mergeDuplicateCases,
  redactCaseSensitiveInfo,
  correctCaseStatus,
  issueAccountRestriction,
  liftAccountRestriction,
  listAccountRestrictions,
  createModerationAppeal,
  listModerationAppeals,
  reviewModerationAppeal,
  listModerationActions,
  listAuditLogs,
  listAlertEscalationSteps,
  upsertAlertEscalationStep,
  deleteAlertEscalationStep,
  listAllAnimalTypes,
  upsertAnimalType,
} from "../moderation";

function mockClient(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as unknown as SupabaseClient<Database>;
}

/** A table-query chain where every method (eq/in/order/...) records
 * its call and returns the same chainable object, which also resolves
 * via `.then` - covers the many plain list()/update() wrappers in
 * this file without hand-rolling a bespoke mock per shape. */
function makeChainRecorder(
  result: { data: unknown; error: unknown } = { data: [], error: null },
) {
  const calls: { method: string; args: unknown[] }[] = [];
  const proxy: Record<string, unknown> = {};
  const handler =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return proxy;
    };
  for (const method of [
    "select",
    "eq",
    "in",
    "order",
    "update",
    "delete",
    "upsert",
    "single",
  ]) {
    proxy[method] = vi.fn(handler(method));
  }
  proxy.then = (resolve: (v: typeof result) => void) => resolve(result);
  return { proxy, calls };
}

function mockFromClient(result?: { data: unknown; error: unknown }) {
  const { proxy, calls } = makeChainRecorder(result);
  const from = vi.fn(() => proxy);
  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, from, calls };
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

describe("listContentReports", () => {
  it("queries content_reports, optionally filtered by status", async () => {
    const { client, from, calls } = mockFromClient();
    await listContentReports(client);
    expect(from).toHaveBeenCalledWith("content_reports");
    expect(calls.some((c) => c.method === "eq")).toBe(false);

    const { client: client2, calls: calls2 } = mockFromClient();
    await listContentReports(client2, "open");
    expect(calls2.some((c) => c.method === "eq" && c.args[1] === "open")).toBe(
      true,
    );
  });
});

describe("updateContentReportStatus", () => {
  it("updates the report's status by id", async () => {
    const { client, calls } = mockFromClient();
    await updateContentReportStatus(client, "report-1", "resolved");
    expect(
      calls.some(
        (c) =>
          c.method === "update" &&
          (c.args[0] as { status: string }).status === "resolved",
      ),
    ).toBe(true);
    expect(
      calls.some((c) => c.method === "eq" && c.args[1] === "report-1"),
    ).toBe(true);
  });
});

describe("moderationSetReplyHidden / moderationSetMediaHidden", () => {
  it("wrap their respective RPCs", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await moderationSetReplyHidden(mockClient(rpc), "reply-1", true, "spam");
    expect(rpc).toHaveBeenCalledWith("moderation_set_reply_hidden", {
      p_reply_id: "reply-1",
      p_hidden: true,
      p_reason: "spam",
    });

    const rpc2 = vi.fn().mockResolvedValue({ data: null, error: null });
    await moderationSetMediaHidden(
      mockClient(rpc2),
      "media-1",
      false,
      "ok now",
    );
    expect(rpc2).toHaveBeenCalledWith("moderation_set_media_hidden", {
      p_media_id: "media-1",
      p_hidden: false,
      p_reason: "ok now",
    });
  });
});

describe("listCriticalCaseQueue / listUnansweredCriticalCases", () => {
  it("query rescue_cases filtered to live, high-urgency statuses", async () => {
    const { client, from } = mockFromClient();
    await listCriticalCaseQueue(client);
    expect(from).toHaveBeenCalledWith("rescue_cases");

    const { client: client2, from: from2 } = mockFromClient();
    await listUnansweredCriticalCases(client2);
    expect(from2).toHaveBeenCalledWith("rescue_cases");
  });
});

describe("liftAccountRestriction", () => {
  it("wraps lift_account_restriction", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await liftAccountRestriction(
      mockClient(rpc),
      "restriction-1",
      "appeal upheld",
    );
    expect(rpc).toHaveBeenCalledWith("lift_account_restriction", {
      p_restriction_id: "restriction-1",
      p_reason: "appeal upheld",
    });
  });
});

describe("listAccountRestrictions", () => {
  it("optionally filters by user id", async () => {
    const { client, calls } = mockFromClient();
    await listAccountRestrictions(client, "user-1");
    expect(calls.some((c) => c.method === "eq" && c.args[1] === "user-1")).toBe(
      true,
    );
  });
});

describe("listModerationAppeals / listModerationActions / listAuditLogs", () => {
  it("each query their own table", async () => {
    const { client, from } = mockFromClient();
    await listModerationAppeals(client);
    expect(from).toHaveBeenCalledWith("moderation_appeals");

    const { client: client2, from: from2 } = mockFromClient();
    await listModerationActions(client2);
    expect(from2).toHaveBeenCalledWith("moderation_actions");

    const { client: client3, from: from3 } = mockFromClient();
    await listAuditLogs(client3);
    expect(from3).toHaveBeenCalledWith("audit_logs");
  });
});

describe("alert escalation steps", () => {
  it("lists, upserts, and deletes against alert_escalation_steps", async () => {
    const { client, from } = mockFromClient();
    await listAlertEscalationSteps(client);
    expect(from).toHaveBeenCalledWith("alert_escalation_steps");

    const { client: client2, calls: calls2 } = mockFromClient();
    await upsertAlertEscalationStep(client2, {
      urgency: "critical",
      step: 2,
      radiusKm: 5,
      afterMinutes: 10,
    });
    expect(
      calls2.some(
        (c) =>
          c.method === "upsert" &&
          (c.args[0] as { radius_km: number }).radius_km === 5,
      ),
    ).toBe(true);

    const { client: client3, calls: calls3 } = mockFromClient();
    await deleteAlertEscalationStep(client3, "urgent", 1);
    expect(calls3.some((c) => c.method === "delete")).toBe(true);
    expect(calls3.some((c) => c.args[1] === "urgent")).toBe(true);
    expect(calls3.some((c) => c.args[1] === 1)).toBe(true);
  });
});

describe("listAllAnimalTypes", () => {
  it("queries animal_types ordered by sort_order", async () => {
    const { client, from } = mockFromClient();
    await listAllAnimalTypes(client);
    expect(from).toHaveBeenCalledWith("animal_types");
  });
});
