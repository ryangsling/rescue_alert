import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { createContentReport } from "../report";

describe("createContentReport", () => {
  it("inserts with the caller as reporter_id and status open", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await createContentReport(client, "user-1", {
      targetType: "reply",
      targetId: "reply-1",
      reason: "harassment",
    });

    expect(from).toHaveBeenCalledWith("content_reports");
    expect(insert).toHaveBeenCalledWith({
      reporter_id: "user-1",
      target_type: "reply",
      target_id: "reply-1",
      reason: "harassment",
      details: undefined,
      status: "open",
    });
  });
});
