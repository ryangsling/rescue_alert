import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  OnboardingCapabilitiesInput,
  OnboardingPreferencesInput,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/**
 * PRD 7.1 steps 5-6, via the complete_onboarding() database function
 * (Part 7 migration) so the multi-table write is one atomic call
 * instead of several requests that could leave a partial state.
 */
export async function completeOnboarding(
  client: Client,
  input: OnboardingCapabilitiesInput & OnboardingPreferencesInput,
) {
  return client.rpc("complete_onboarding", {
    p_capabilities: input.capabilities,
    p_preferred_animal_type_ids: input.preferredAnimalTypeIds,
    p_alert_radius_km: input.alertRadiusKm,
  });
}
