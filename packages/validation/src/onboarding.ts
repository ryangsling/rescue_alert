import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type VolunteerCapability =
  Database["public"]["Enums"]["volunteer_capability_type"];

/** PRD 7.1 step 5. Kept as a literal array (not derived at runtime) so Zod has a tuple to validate against. */
const VOLUNTEER_CAPABILITIES = [
  "on_site_rescue",
  "transport",
  "veterinary_professional",
  "veterinary_assistant",
  "temporary_foster",
  "shelter_coordination",
  "adoption_support",
  "case_coordination",
  "financial_support_interest",
] as const satisfies readonly VolunteerCapability[];

// Compile-time exhaustiveness check in both directions: this fails to
// typecheck if the DB enum (packages/types, generated from the
// schema) and this literal array ever drift apart.
type _CapabilitiesCoverDbEnum =
  VolunteerCapability extends (typeof VOLUNTEER_CAPABILITIES)[number]
    ? true
    : never;
type _DbEnumCoversCapabilities =
  (typeof VOLUNTEER_CAPABILITIES)[number] extends VolunteerCapability
    ? true
    : never;
const _exhaustive: [_CapabilitiesCoverDbEnum, _DbEnumCoversCapabilities] = [
  true,
  true,
];
void _exhaustive;

export const volunteerCapabilitySchema = z.enum(VOLUNTEER_CAPABILITIES);

export const onboardingCapabilitiesSchema = z.object({
  capabilities: z.array(volunteerCapabilitySchema).default([]),
});

export type OnboardingCapabilitiesInput = z.infer<
  typeof onboardingCapabilitiesSchema
>;

/**
 * PRD open question 7 leaves the initial alert-radius range
 * unresolved; 25km is a reasonable UI bound for the MVP's constrained
 * Dhaka pilot area, not a value the PRD specifies. The database's own
 * constraint (Part 3, notification_preferences.alert_radius_km) only
 * requires the value to be positive.
 */
export const onboardingPreferencesSchema = z.object({
  preferredAnimalTypeIds: z.array(z.uuid()).default([]),
  alertRadiusKm: z.number().positive().max(25),
});

export type OnboardingPreferencesInput = z.infer<
  typeof onboardingPreferencesSchema
>;
