import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";

type Client = SupabaseClient<Database>;

/** PRD 25: the public share page's exactly seven elements - returns
 * null for anything not publicly eligible (pre-publication, duplicate,
 * rejected, or location-restricted). Anon-safe by construction. */
export async function getPublicCaseDetail(
  client: Client,
  publicReference: string,
) {
  return client.rpc("get_public_case_detail", {
    p_public_reference: publicReference,
  });
}

export async function listPublicOpenCases(
  client: Client,
  limit = 20,
  offset = 0,
) {
  return client.rpc("list_public_open_cases", {
    p_limit: limit,
    p_offset: offset,
  });
}

/** "History" means a recorded outcome (close_case()), not merely a
 * terminal status - see list_public_rescue_history() for why. */
export async function listPublicRescueHistory(
  client: Client,
  limit = 20,
  offset = 0,
) {
  return client.rpc("list_public_rescue_history", {
    p_limit: limit,
    p_offset: offset,
  });
}

export interface PublicSignedUrlResult {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}

/** The bucket stays private; this only succeeds for media
 * is_media_publicly_visible() already allows anon to read (RLS on
 * storage.objects), so it is safe to call without a signed-in session. */
export async function getPublicMediaSignedUrl(
  client: Client,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<PublicSignedUrlResult> {
  const { data, error } = await client.storage
    .from("rescue-media")
    .createSignedUrl(storagePath, expiresInSeconds);
  return { data, error: error ? { message: error.message } : null };
}
