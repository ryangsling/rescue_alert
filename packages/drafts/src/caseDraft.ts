import { z } from "zod";
import {
  caseLocationSchema,
  hazardTypeSchema,
  incidentTypeSchema,
  urgencyLevelSchema,
} from "@rescue-alert/validation";

/**
 * CASE-001, DESIGN.md 14.3: a draft is saved after every step of the
 * seven-step report flow, so almost everything here is optional - a
 * user who has only completed step 1 has a draft with just
 * incidentType/urgency set. idempotencyKey is generated once, at
 * draft creation, and never changes; it is both this draft's storage
 * key and the same value create_case() (Part 8 DB layer) uses for
 * OFF-004 dedup, so a draft and its eventual submission are always
 * the same idempotency identity.
 */
export const caseDraftSchema = z.object({
  idempotencyKey: z.uuid(),
  currentStep: z.number().int().min(1).max(7),
  incidentType: incidentTypeSchema.optional(),
  urgency: urgencyLevelSchema.optional(),
  animalTypeId: z.uuid().optional(),
  description: z.string().optional(),
  location: caseLocationSchema.optional(),
  landmark: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  upazilaOrThana: z.string().optional(),
  creatorOnSite: z.boolean().optional(),
  lastSeenAt: z.iso.datetime().optional(),
  /** PRD 12.1 hazard flags - optional like every other step field, since a draft may not have reached this step yet. */
  hazardFlags: z.array(hazardTypeSchema).optional(),
  /** Local file URIs (mobile) or object URLs/blob references (web) pending compression/upload - never a remote storage path until actually uploaded. */
  localMediaUris: z.array(z.string()).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CaseDraft = z.infer<typeof caseDraftSchema>;

export function createEmptyDraft(idempotencyKey: string): CaseDraft {
  const now = new Date().toISOString();
  return {
    idempotencyKey,
    currentStep: 1,
    localMediaUris: [],
    createdAt: now,
    updatedAt: now,
  };
}
