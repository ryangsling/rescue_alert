import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { closeCase, reopenCase, getUserRescueHistory } from "../closure";

describe("closeCase", () => {
  it("forwards outcome/final update and converts contribution keys to the RPC's shape", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await closeCase(client, {
      caseId: "case-1",
      outcome: "successfully_rescued",
      finalUpdate: "All done.",
      contributions: [{ userId: "user-1", category: "on_site_responder" }],
    });

    expect(rpc).toHaveBeenCalledWith("close_case", {
      p_case_id: "case-1",
      p_outcome: "successfully_rescued",
      p_final_update: "All done.",
      p_follow_up_case_id: undefined,
      p_contributions: [{ user_id: "user-1", category: "on_site_responder" }],
      p_reason: undefined,
    });
  });

  it("passes undefined, not an empty array, when no contributions are given", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await closeCase(client, {
      caseId: "case-1",
      outcome: "could_not_be_found",
      finalUpdate: "Searched the area, no sign of the animal.",
    });

    expect(rpc).toHaveBeenCalledWith(
      "close_case",
      expect.objectContaining({ p_contributions: undefined }),
    );
  });
});

describe("reopenCase", () => {
  it("calls transition_case_status with the open status and the given actor/reason", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await reopenCase(client, "moderator-1", "case-1", "Closed in error");

    expect(rpc).toHaveBeenCalledWith("transition_case_status", {
      p_case_id: "case-1",
      p_new_status: "open",
      p_actor_id: "moderator-1",
      p_reason: "Closed in error",
    });
  });
});

describe("getUserRescueHistory", () => {
  it("calls get_user_rescue_history with the given user id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await getUserRescueHistory(client, "user-1");

    expect(rpc).toHaveBeenCalledWith("get_user_rescue_history", {
      p_user_id: "user-1",
    });
  });
});
