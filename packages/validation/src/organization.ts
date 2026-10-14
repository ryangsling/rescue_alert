import { z } from "zod";
import type { Database } from "@rescue-alert/types";
import { incidentTypeSchema, urgencyLevelSchema } from "./case";

type OrganizationType = Database["public"]["Enums"]["organization_type"];

const ORGANIZATION_TYPES = [
  "clinic",
  "shelter",
  "ngo",
  "rescue_group",
  "individual_coordinator",
] as const satisfies readonly OrganizationType[];

type _AssertExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _orgTypesExhaustive: _AssertExhaustive<
  (typeof ORGANIZATION_TYPES)[number],
  OrganizationType
> = [true, true];
void _orgTypesExhaustive;

export const organizationTypeSchema = z.enum(ORGANIZATION_TYPES);

/** ORG-001: a verification request is just creating the organization itself - verification_status starts 'pending' by default and only a moderator can change it. */
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "An organization name is required"),
  orgType: organizationTypeSchema,
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/** ORG-003: service area, hours, and contact method - everything but org_type/name, which are set at creation. */
export const updateOrganizationSchema = z.object({
  serviceArea: z.string().trim().max(500).optional(),
  contactMethod: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const organizationServiceSchema = z.object({
  serviceName: z.string().trim().min(1, "A service name is required"),
  description: z.string().trim().max(1000).optional(),
});
export type OrganizationServiceInput = z.infer<
  typeof organizationServiceSchema
>;

/** ORG-004: explicit opt-in only - empty arrays mean no dispatch at all, never "everything". */
export const organizationAvailabilitySchema = z.object({
  isCurrentlyAvailable: z.boolean(),
  hoursText: z.string().trim().max(500).optional(),
  optedInUrgencyLevels: z.array(urgencyLevelSchema),
  optedInIncidentTypes: z.array(incidentTypeSchema),
});
export type OrganizationAvailabilityInput = z.infer<
  typeof organizationAvailabilitySchema
>;

/** PRD 5.4: capacity, species (via a separate animal-types join), area, dates, and limitations. Address is private - never part of this shape, only ever read through getFosterAddress(). */
export const fosterProfileSchema = z.object({
  capacity: z.number().int().min(1),
  area: z.string().trim().max(500).optional(),
  address: z.string().trim().max(1000).optional(),
  availableFrom: z.iso.date().optional(),
  availableUntil: z.iso.date().optional(),
  limitations: z.string().trim().max(1000).optional(),
  isActive: z.boolean(),
});
export type FosterProfileInput = z.infer<typeof fosterProfileSchema>;

export const createPlacementRequestSchema = z.object({
  caseId: z.uuid(),
  fosterProfileId: z.uuid(),
});
export type CreatePlacementRequestInput = z.infer<
  typeof createPlacementRequestSchema
>;

export const placementRequestDecisionSchema = z.enum(["approved", "declined"]);
export type PlacementRequestDecision = z.infer<
  typeof placementRequestDecisionSchema
>;
