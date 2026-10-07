import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  CreateResponseInput,
  WithdrawResponseInput,
  UpdateResponseStatusInput,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/**
 * RESP-001/002/003: "I can help". responder_id is never passed in -
 * enforce_case_response_rules() (Part 12 migration) requires it to be
 * the caller and rejects anything else, so there is nothing for this
 * function to get wrong there.
 */
export async function createResponse(
  client: Client,
  responderId: string,
  input: CreateResponseInput,
) {
  return client
    .from("case_responses")
    .insert({
      case_id: input.caseId,
      responder_id: responderId,
      assistance_types: input.assistanceTypes,
      eta_at: input.etaAt,
      availability_note: input.availabilityNote,
    })
    .select()
    .single();
}

/** RESP-004. withdrawal_reason is required by both the DB CHECK constraint and the trigger. */
export async function withdrawResponse(
  client: Client,
  input: WithdrawResponseInput,
) {
  return client
    .from("case_responses")
    .update({ status: "withdrawn", withdrawal_reason: input.reason })
    .eq("id", input.responseId)
    .select()
    .single();
}

/**
 * Coordinator-only transition (confirmed/completed/declined/
 * unresponsive) - enforce_case_response_rules() rejects this from
 * anyone else, and from a coordinator trying to change anything but
 * status on the same call.
 */
export async function updateResponseStatus(
  client: Client,
  input: UpdateResponseStatusInput,
) {
  return client
    .from("case_responses")
    .update({ status: input.status })
    .eq("id", input.responseId)
    .select()
    .single();
}

export async function listCaseResponses(client: Client, caseId: string) {
  return client
    .from("case_responses")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
}
