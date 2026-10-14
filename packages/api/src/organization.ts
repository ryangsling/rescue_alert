import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationServiceInput,
  OrganizationAvailabilityInput,
  FosterProfileInput,
  CreatePlacementRequestInput,
  PlacementRequestDecision,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/**
 * ORG-001: requesting verification is just creating the organization
 * itself (verification_status defaults to 'pending'); ORG-005 then
 * requires the creator to join as its first named member - a
 * separate insert, since organization_members_insert's "first
 * member" branch is what RLS actually checks.
 */
export async function createOrganization(
  client: Client,
  actorId: string,
  input: CreateOrganizationInput,
) {
  const { data: org, error } = await client
    .from("organizations")
    .insert({ name: input.name, org_type: input.orgType, created_by: actorId })
    .select()
    .single();
  if (error || !org) return { data: null, error };

  const { error: memberError } = await client
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: actorId,
      role: "administrator",
    });
  if (memberError) return { data: null, error: memberError };

  return { data: org, error: null };
}

export async function updateOrganization(
  client: Client,
  organizationId: string,
  input: UpdateOrganizationInput,
) {
  return client
    .from("organizations")
    .update({
      service_area: input.serviceArea,
      contact_method: input.contactMethod,
      description: input.description,
    })
    .eq("id", organizationId);
}

/** ORG-007: the only sanctioned way to bump last_confirmed_at. */
export async function confirmOrganizationListing(
  client: Client,
  organizationId: string,
) {
  return client.rpc("confirm_organization_listing", {
    p_organization_id: organizationId,
  });
}

export async function listMyOrganizations(client: Client, userId: string) {
  return client
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("user_id", userId);
}

export async function listOrganizationMembers(
  client: Client,
  organizationId: string,
) {
  return client
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId);
}

/** ORG-005: an administrator adds a named account - never a shared credential. */
export async function addOrganizationMember(
  client: Client,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: userId });
}

export async function removeOrganizationMember(
  client: Client,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
}

export async function upsertOrganizationService(
  client: Client,
  organizationId: string,
  input: OrganizationServiceInput,
) {
  return client.from("organization_services").insert({
    organization_id: organizationId,
    service_name: input.serviceName,
    description: input.description,
  });
}

export async function removeOrganizationService(
  client: Client,
  serviceId: string,
) {
  return client.from("organization_services").delete().eq("id", serviceId);
}

export async function listOrganizationServices(
  client: Client,
  organizationId: string,
) {
  return client
    .from("organization_services")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
}

export async function getOrganizationAvailability(
  client: Client,
  organizationId: string,
) {
  return client
    .from("organization_availability")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
}

/** ORG-004: explicit opt-in only - no row at all means no dispatch. */
export async function setOrganizationAvailability(
  client: Client,
  organizationId: string,
  input: OrganizationAvailabilityInput,
) {
  return client.from("organization_availability").upsert({
    organization_id: organizationId,
    is_currently_available: input.isCurrentlyAvailable,
    hours_text: input.hoursText,
    opted_in_urgency_levels: input.optedInUrgencyLevels,
    opted_in_incident_types: input.optedInIncidentTypes,
  });
}

/** ORG-003/ORG-007: the public directory - anon-safe by construction. */
export async function listVerifiedDirectory(client: Client) {
  return client.rpc("list_verified_directory");
}

export async function createFosterProfile(
  client: Client,
  userId: string,
  input: FosterProfileInput,
) {
  return client
    .from("foster_profiles")
    .insert({
      user_id: userId,
      capacity: input.capacity,
      area: input.area,
      address: input.address,
      available_from: input.availableFrom,
      available_until: input.availableUntil,
      limitations: input.limitations,
      is_active: input.isActive,
    })
    .select()
    .single();
}

export async function updateFosterProfile(
  client: Client,
  fosterProfileId: string,
  input: FosterProfileInput,
) {
  return client
    .from("foster_profiles")
    .update({
      capacity: input.capacity,
      area: input.area,
      address: input.address,
      available_from: input.availableFrom,
      available_until: input.availableUntil,
      limitations: input.limitations,
      is_active: input.isActive,
    })
    .eq("id", fosterProfileId);
}

export async function getMyFosterProfile(client: Client, userId: string) {
  return client
    .from("foster_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
}

/** PRD 5.4: active fosters only, signed-in users only - never a public (anon) listing. */
export async function listActiveFosterProfiles(client: Client) {
  return client.from("foster_profiles").select("*").eq("is_active", true);
}

/** PRD 5.4: the case creator/coordinator asks a specific foster - requested_by is never trusted from the client. */
export async function createPlacementRequest(
  client: Client,
  requestedBy: string,
  input: CreatePlacementRequestInput,
) {
  return client
    .from("foster_placement_requests")
    .insert({
      case_id: input.caseId,
      foster_profile_id: input.fosterProfileId,
      requested_by: requestedBy,
    })
    .select()
    .single();
}

export async function withdrawPlacementRequest(
  client: Client,
  requestId: string,
) {
  return client
    .from("foster_placement_requests")
    .update({ status: "withdrawn" })
    .eq("id", requestId);
}

/** Only the foster themselves (or a moderator) may decide - enforced by guard_foster_placement_request(). */
export async function respondToPlacementRequest(
  client: Client,
  actorId: string,
  requestId: string,
  decision: PlacementRequestDecision,
) {
  return client
    .from("foster_placement_requests")
    .update({
      status: decision,
      decided_by: actorId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId);
}

export async function listPlacementRequestsForFoster(
  client: Client,
  fosterProfileId: string,
) {
  return client
    .from("foster_placement_requests")
    .select("*")
    .eq("foster_profile_id", fosterProfileId)
    .order("created_at", { ascending: false });
}

export async function listPlacementRequestsForCase(
  client: Client,
  caseId: string,
) {
  return client
    .from("foster_placement_requests")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
}

/** PRD 5.4: returns null unless the caller is the foster, a moderator, or the creator/coordinator of a case with an approved request. */
export async function getFosterAddress(
  client: Client,
  fosterProfileId: string,
) {
  return client.rpc("get_foster_address", {
    p_foster_profile_id: fosterProfileId,
  });
}
