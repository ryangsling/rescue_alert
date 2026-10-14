import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type { CreateContentReportInput } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/** MOD-001. target_type/target_id are polymorphic - resolved by moderation review, not an FK. */
export async function createContentReport(
  client: Client,
  reporterId: string,
  input: CreateContentReportInput,
) {
  return client
    .from("content_reports")
    .insert({
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      details: input.details,
      status: "open",
    })
    .select()
    .single();
}
