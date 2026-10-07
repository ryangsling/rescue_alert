import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";

type Client = SupabaseClient<Database>;

/** case_watchers is owner-only (RLS): a user can only ever watch/unwatch on their own behalf. */
export async function watchCase(
  client: Client,
  userId: string,
  caseId: string,
) {
  return client
    .from("case_watchers")
    .upsert({ user_id: userId, case_id: caseId })
    .select()
    .single();
}

export async function unwatchCase(
  client: Client,
  userId: string,
  caseId: string,
) {
  return client
    .from("case_watchers")
    .delete()
    .eq("user_id", userId)
    .eq("case_id", caseId);
}

export async function isWatchingCase(
  client: Client,
  userId: string,
  caseId: string,
) {
  const { data, error } = await client
    .from("case_watchers")
    .select("case_id")
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .maybeSingle();
  return { isWatching: data !== null, error };
}
