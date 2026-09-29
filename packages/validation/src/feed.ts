import { z } from "zod";
import { caseLocationSchema, incidentTypeSchema } from "./case";

/**
 * CASE-... / Part 10 nearby feed. Mirrors list_feed_cases()'s own
 * parameter bounds (limit capped at 50 server-side too - this schema
 * rejecting an over-limit request early is a client-side convenience,
 * not the actual enforcement).
 */
export const feedFiltersSchema = z.object({
  viewerLocation: caseLocationSchema.optional(),
  radiusMeters: z.number().int().positive().max(200_000).optional(),
  animalTypeIds: z.array(z.uuid()).optional(),
  incidentTypes: z.array(incidentTypeSchema).optional(),
  searchText: z.string().trim().max(200).optional(),
  since: z.iso.datetime().optional(),
  includeClosed: z.boolean().default(false),
  limit: z.number().int().positive().max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export type FeedFiltersInput = z.infer<typeof feedFiltersSchema>;
