import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";

type Client = SupabaseClient<Database>;
type AssistanceType = Database["public"]["Enums"]["assistance_type"];

export async function listCaseNeeds(client: Client, caseId: string) {
  return client
    .from("case_needs")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
}

/** RESP-006 needs board editing - creator/coordinator/moderator only (case_needs_write RLS). Fulfillment itself follows responses automatically; see sync_case_needs_from_response(). */
export async function addCaseNeed(
  client: Client,
  caseId: string,
  needType: AssistanceType,
) {
  return client
    .from("case_needs")
    .insert({ case_id: caseId, need_type: needType })
    .select()
    .single();
}

export async function removeCaseNeed(
  client: Client,
  caseId: string,
  needType: AssistanceType,
) {
  return client
    .from("case_needs")
    .delete()
    .eq("case_id", caseId)
    .eq("need_type", needType);
}
