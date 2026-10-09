import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type { CreateCaseInput } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/** PostGIS accepts WKT text for a geography column over PostgREST. */
function toWkt(location: CreateCaseInput["location"]): string {
  return `SRID=4326;POINT(${location.longitude} ${location.latitude})`;
}

/**
 * The generated Args type for create_case() marks these as required
 * `string`, not `string | null`, even though the underlying SQL
 * parameters accept null (verified directly against the live RPC:
 * passing null for each produces the expected nullable-column result,
 * e.g. title falls back to "... - Animal"). The generator infers
 * strictness from "no SQL default", not actual nullability, which is
 * a generator limitation, not a real runtime constraint - this type
 * corrects it rather than fighting it with `as any` at the call site.
 */
type CreateCaseArgs = Omit<
  Database["public"]["Functions"]["create_case"]["Args"],
  | "p_animal_type_id"
  | "p_landmark"
  | "p_division"
  | "p_district"
  | "p_upazila_or_thana"
> & {
  p_animal_type_id: string | null;
  p_landmark: string | null;
  p_division: string | null;
  p_district: string | null;
  p_upazila_or_thana: string | null;
};

/** CASE-002, CASE-008, CASE-009, OFF-004. See create_case() (Part 8 migration) for the atomicity/idempotency contract. */
export async function createCase(client: Client, input: CreateCaseInput) {
  const args: CreateCaseArgs = {
    p_idempotency_key: input.idempotencyKey,
    p_incident_type: input.incidentType,
    p_urgency: input.urgency,
    p_animal_type_id: input.animalTypeId ?? null,
    p_description: input.description,
    p_location: toWkt(input.location),
    p_landmark: input.landmark ?? null,
    p_division: input.division ?? null,
    p_district: input.district ?? null,
    p_upazila_or_thana: input.upazilaOrThana ?? null,
    p_creator_on_site: input.creatorOnSite,
    p_last_seen_at: input.lastSeenAt,
  };
  return client.rpc(
    "create_case",
    args as Database["public"]["Functions"]["create_case"]["Args"],
  );
}

/**
 * Returns no row unless the caller is an accepted responder, the
 * coordinator, an org member, or a moderator/admin for this case -
 * see get_case_exact_location() (Part 1, Part 12 follow-up).
 * latitude/longitude as plain doubles, never a raw geography value
 * (PostgREST would otherwise serialize one as an unparseable WKB hex
 * string - see list_feed_cases' own fix for the same issue).
 */
export async function getCaseExactLocation(client: Client, caseId: string) {
  const { data, error } = await client.rpc("get_case_exact_location", {
    p_case_id: caseId,
  });
  return { data: data?.[0] ?? null, error };
}

/** CASE-009. See find_nearby_duplicate_cases() for the disclosed default radius/timeframe. */
export async function findNearbyDuplicateCases(
  client: Client,
  location: CreateCaseInput["location"],
  options?: { radiusMeters?: number; sinceMinutes?: number },
) {
  return client.rpc("find_nearby_duplicate_cases", {
    p_location: toWkt(location),
    p_radius_meters: options?.radiusMeters,
    p_since_minutes: options?.sinceMinutes,
  });
}

type RescueMediaRow = Database["public"]["Tables"]["rescue_media"]["Row"];

/** Deliberately a small, hand-written shape rather than naming supabase-js's own inferred response types directly, which pulls in unexported cross-package generics (proven: TS2742 "cannot be named without a reference to ..."). */
export interface UploadCaseMediaResult {
  data: RescueMediaRow | null;
  error: { message: string } | null;
}

/**
 * CASE-003/004/005. Uploads already-compressed, EXIF-stripped bytes
 * (see packages/media) to the case's storage path, then records the
 * rescue_media row - exif_stripped: true is required by a database
 * CHECK constraint, not just this function's own honesty.
 */
export async function uploadCaseMedia(
  client: Client,
  params: {
    caseId: string;
    uploaderId: string;
    mediaId: string;
    fileExtension: string;
    contentType: string;
    bytes: Blob | ArrayBuffer | Uint8Array;
    isGraphic?: boolean;
    /** Part 12: attaches this upload to an official update rather than the case in general. */
    updateId?: string;
  },
): Promise<UploadCaseMediaResult> {
  const storagePath = `${params.caseId}/${params.mediaId}.${params.fileExtension}`;

  const { error: uploadError } = await client.storage
    .from("rescue-media")
    .upload(storagePath, params.bytes, { contentType: params.contentType });
  if (uploadError) {
    return { data: null, error: { message: uploadError.message } };
  }

  const { data, error } = await client
    .from("rescue_media")
    .insert({
      case_id: params.caseId,
      update_id: params.updateId,
      uploader_id: params.uploaderId,
      storage_path: storagePath,
      exif_stripped: true,
      is_graphic: params.isGraphic ?? false,
    })
    .select()
    .single();

  return { data, error: error ? { message: error.message } : null };
}

/** Part 12: every media row for a case, oldest first - the case detail screen's media gallery and each update's own attachments. */
export async function listCaseMedia(client: Client, caseId: string) {
  return client
    .from("rescue_media")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
}

export interface SignedUrlResult {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}

/** Read access follows the case's own visibility rule (Part 8 storage RLS). */
export async function getCaseMediaSignedUrl(
  client: Client,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<SignedUrlResult> {
  const { data, error } = await client.storage
    .from("rescue-media")
    .createSignedUrl(storagePath, expiresInSeconds);
  return { data, error: error ? { message: error.message } : null };
}
