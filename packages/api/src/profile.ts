import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";

type Client = SupabaseClient<Database>;

/**
 * Batched display-name lookup for a case detail screen, which needs
 * names for a creator, coordinator, every responder, and every
 * comment/reply/update author - one query instead of one per row.
 * profiles is readable by any authenticated user (profiles_select_authenticated).
 */
export async function getProfileNames(
  client: Client,
  userIds: readonly string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return {};

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.id, row.full_name]));
}
