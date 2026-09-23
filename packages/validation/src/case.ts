import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type IncidentType = Database["public"]["Enums"]["incident_type"];
type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];

/** PRD 8.1's 16 incident types. Kept as a literal array (not derived at runtime) so Zod has a tuple to validate against. */
const INCIDENT_TYPES = [
  "injured_animal",
  "road_accident",
  "critically_ill_animal",
  "trapped_animal",
  "abandoned_animal",
  "abuse_or_cruelty_suspected",
  "mother_with_babies",
  "orphaned_babies",
  "traffic_risk_animal",
  "temporary_foster_needed",
  "shelter_needed",
  "transport_needed",
  "veterinary_treatment_needed",
  "lost_animal_found",
  "adoption_needed",
  "other_animal_welfare_concern",
] as const satisfies readonly IncidentType[];

/** PRD 8.2's 4 urgency levels. */
const URGENCY_LEVELS = [
  "critical",
  "urgent",
  "support_needed",
  "adoption_community",
] as const satisfies readonly UrgencyLevel[];

// Compile-time exhaustiveness check in both directions, same pattern
// as onboarding.ts's capabilities list: fails to typecheck if either
// literal array and the DB enum it mirrors ever drift apart.
type _AssertExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _incidentTypesExhaustive: _AssertExhaustive<
  (typeof INCIDENT_TYPES)[number],
  IncidentType
> = [true, true];
const _urgencyLevelsExhaustive: _AssertExhaustive<
  (typeof URGENCY_LEVELS)[number],
  UrgencyLevel
> = [true, true];
void _incidentTypesExhaustive;
void _urgencyLevelsExhaustive;

export const incidentTypeSchema = z.enum(INCIDENT_TYPES);
export const urgencyLevelSchema = z.enum(URGENCY_LEVELS);

/** A GPS point, movable pin, or manually chosen location (CASE-006) - always lat/lng at this layer; PostGIS WKT conversion happens in packages/api. */
export const caseLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * CASE-002: incident type, urgency, animal type, location,
 * description, and reporter-presence state are the required fields.
 * "Visible condition" (PRD 7.2 step 4 / DESIGN.md 14.3 step 3) is
 * free text captured here in `description`, not a separate
 * structured field - CASE-002 itself, the authoritative requirement,
 * lists no distinct "condition" field, and the only other PRD mention
 * of "visible-condition labels" is an AI feature suggesting text for
 * this same field (section 14, post-MVP).
 */
export const createCaseSchema = z.object({
  idempotencyKey: z.uuid(),
  incidentType: incidentTypeSchema,
  urgency: urgencyLevelSchema,
  animalTypeId: z.uuid().optional(),
  description: z.string().trim().min(1, "Describe what you see"),
  location: caseLocationSchema,
  landmark: z.string().trim().max(500).optional(),
  division: z.string().trim().optional(),
  district: z.string().trim().optional(),
  upazilaOrThana: z.string().trim().optional(),
  creatorOnSite: z.boolean(),
  lastSeenAt: z.iso.datetime().optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
