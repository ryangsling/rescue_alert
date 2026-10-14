import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type ClosureOutcome = Database["public"]["Enums"]["closure_outcome"];
type ContributionCategory =
  Database["public"]["Enums"]["contribution_category"];

/** PRD 9.3, in the order listed there. */
const CLOSURE_OUTCOMES = [
  "successfully_rescued",
  "treated_and_returned_safely",
  "transferred_to_veterinary_care",
  "transferred_to_organization",
  "moved_to_temporary_foster",
  "moved_to_shelter",
  "adopted",
  "recovered_without_intervention",
  "could_not_be_found",
  "duplicate_report",
  "report_inaccurate",
  "died_before_help_arrived",
  "died_during_or_after_treatment",
  "other_documented_outcome",
] as const satisfies readonly ClosureOutcome[];

type _AssertOutcomesExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _outcomesExhaustive: _AssertOutcomesExhaustive<
  (typeof CLOSURE_OUTCOMES)[number],
  ClosureOutcome
> = [true, true];
void _outcomesExhaustive;

export const closureOutcomeSchema = z.enum(CLOSURE_OUTCOMES);

/** PRD 13.1, in the order listed there. */
const CONTRIBUTION_CATEGORIES = [
  "on_site_responder",
  "transport_volunteer",
  "foster_provider",
  "veterinary_support",
  "case_coordinator",
  "organization_responder",
  "adoption_facilitator",
  "moderator_contribution",
] as const satisfies readonly ContributionCategory[];

type _AssertCategoriesExhaustive<
  Literal extends string,
  Enum extends string,
> = [Enum extends Literal ? true : never, Literal extends Enum ? true : never];
const _categoriesExhaustive: _AssertCategoriesExhaustive<
  (typeof CONTRIBUTION_CATEGORIES)[number],
  ContributionCategory
> = [true, true];
void _categoriesExhaustive;

export const contributionCategorySchema = z.enum(CONTRIBUTION_CATEGORIES);

/** OUT-001, OUT-002: a structured outcome and a non-empty final update are both required for normal closure. */
export const closeCaseSchema = z.object({
  caseId: z.uuid(),
  outcome: closureOutcomeSchema,
  finalUpdate: z
    .string()
    .trim()
    .min(1, "A final update is required to close a case"),
  followUpCaseId: z.uuid().optional(),
  contributions: z
    .array(
      z.object({
        userId: z.uuid(),
        category: contributionCategorySchema,
      }),
    )
    .optional(),
  reason: z.string().trim().optional(),
});

export type CloseCaseInput = z.infer<typeof closeCaseSchema>;
