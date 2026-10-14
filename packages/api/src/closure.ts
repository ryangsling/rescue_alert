import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type { CloseCaseInput } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/**
 * OUT-001..004 (Part 13). close_case() derives the actor from
 * auth.uid() itself - there is no actor id to pass or spoof here.
 */
export async function closeCase(client: Client, input: CloseCaseInput) {
  return client.rpc("close_case", {
    p_case_id: input.caseId,
    p_outcome: input.outcome,
    p_final_update: input.finalUpdate,
    p_follow_up_case_id: input.followUpCaseId,
    p_contributions: input.contributions?.map((c) => ({
      user_id: c.userId,
      category: c.category,
    })),
    p_reason: input.reason,
  });
}

/**
 * OUT-005: the 'closed' -> 'open' transition already requires a
 * moderator/administrator role (case_status_transitions), enforced
 * inside transition_case_status() itself - no separate reopen
 * function is needed.
 */
export async function reopenCase(
  client: Client,
  actorId: string,
  caseId: string,
  reason?: string,
) {
  return client.rpc("transition_case_status", {
    p_case_id: caseId,
    p_new_status: "open",
    p_actor_id: actorId,
    p_reason: reason,
  });
}

/** OUT-006, PROF-006: verified contributions only, no sensitive case detail. */
export async function getUserRescueHistory(client: Client, userId: string) {
  return client.rpc("get_user_rescue_history", { p_user_id: userId });
}
