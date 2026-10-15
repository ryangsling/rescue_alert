import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  createComment,
  createReply,
  createCaseUpdate,
  listCaseComments,
  listCaseUpdates,
  editComment,
  hideComment,
  editReply,
  hideReply,
} from "../comment";

function insertClient() {
  const single = vi.fn().mockResolvedValue({ data: {}, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, from, insert };
}

describe("createComment", () => {
  it("inserts with the caller as author_id", async () => {
    const { client, from, insert } = insertClient();
    await createComment(client, "user-1", { caseId: "case-1", body: "hi" });
    expect(from).toHaveBeenCalledWith("case_comments");
    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      author_id: "user-1",
      body: "hi",
    });
  });
});

describe("createReply", () => {
  it("inserts against comment_replies with the caller as author_id", async () => {
    const { client, from, insert } = insertClient();
    await createReply(client, "user-1", { commentId: "c1", body: "thanks" });
    expect(from).toHaveBeenCalledWith("comment_replies");
    expect(insert).toHaveBeenCalledWith({
      comment_id: "c1",
      author_id: "user-1",
      body: "thanks",
    });
  });
});

describe("createCaseUpdate", () => {
  it("forwards is_pinned through to the insert", async () => {
    const { client, insert } = insertClient();
    await createCaseUpdate(client, "coord-1", {
      caseId: "case-1",
      body: "vet arrived",
      isPinned: true,
    });
    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      author_id: "coord-1",
      body: "vet arrived",
      is_pinned: true,
    });
  });
});

describe("editComment", () => {
  it("sets edited_at alongside the new body", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn<
      (values: Record<string, unknown>) => { eq: typeof eq }
    >(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await editComment(client, "c1", "corrected text");
    const call = update.mock.calls[0]![0];
    expect(call.body).toBe("corrected text");
    expect(typeof call.edited_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "c1");
  });
});

describe("hideComment", () => {
  it("sets is_hidden true rather than deleting the row", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await hideComment(client, "c1");
    expect(update).toHaveBeenCalledWith({ is_hidden: true });
  });
});

describe("listCaseComments / listCaseUpdates", () => {
  it("each query their own table for the given case", async () => {
    const result = { data: [] as unknown[], error: null };
    const chain: Record<string, unknown> = {
      order: vi.fn(() => chain),
      then: (resolve: (v: typeof result) => void) => resolve(result),
    };
    const eq = vi.fn(() => chain);
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await listCaseComments(client, "case-1");
    expect(from).toHaveBeenCalledWith("case_comments");
    expect(eq).toHaveBeenCalledWith("case_id", "case-1");

    await listCaseUpdates(client, "case-1");
    expect(from).toHaveBeenCalledWith("case_updates");
  });
});

describe("editReply", () => {
  it("sets edited_at alongside the new body", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn<
      (values: Record<string, unknown>) => { eq: typeof eq }
    >(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await editReply(client, "r1", "corrected reply");
    const call = update.mock.calls[0]![0];
    expect(call.body).toBe("corrected reply");
    expect(typeof call.edited_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "r1");
  });
});

describe("hideReply", () => {
  it("sets is_hidden true rather than deleting the row", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await hideReply(client, "r1");
    expect(update).toHaveBeenCalledWith({ is_hidden: true });
  });
});
