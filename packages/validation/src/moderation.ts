import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type AccountRestrictionType =
  Database["public"]["Enums"]["account_restriction_type"];
type CaseStatus = Database["public"]["Enums"]["case_status"];
type ContentReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
type AppealStatus = "upheld" | "overturned";

const ACCOUNT_RESTRICTION_TYPES = [
  "warning",
  "restricted",
  "suspended",
  "banned",
] as const satisfies readonly AccountRestrictionType[];

const CASE_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "open",
  "response_committed",
  "responder_en_route",
  "animal_located",
  "rescue_in_progress",
  "transporting",
  "at_clinic_foster_shelter",
  "follow_up_required",
  "resolved",
  "closed",
  "no_longer_found",
  "duplicate",
  "false_report",
  "spam",
  "unsafe_or_prohibited_content",
  "cancelled_by_reporter",
  "closed_by_moderator",
] as const satisfies readonly CaseStatus[];

const CONTENT_REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const satisfies readonly ContentReportStatus[];

const APPEAL_STATUSES = [
  "upheld",
  "overturned",
] as const satisfies readonly AppealStatus[];

type _AssertExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _restrictionTypesExhaustive: _AssertExhaustive<
  (typeof ACCOUNT_RESTRICTION_TYPES)[number],
  AccountRestrictionType
> = [true, true];
const _caseStatusesExhaustive: _AssertExhaustive<
  (typeof CASE_STATUSES)[number],
  CaseStatus
> = [true, true];
void _restrictionTypesExhaustive;
void _caseStatusesExhaustive;

export const accountRestrictionTypeSchema = z.enum(ACCOUNT_RESTRICTION_TYPES);
export const contentReportStatusSchema = z.enum(CONTENT_REPORT_STATUSES);
export const appealStatusSchema = z.enum(APPEAL_STATUSES);
export const caseStatusSchema = z.enum(CASE_STATUSES);

const reasonSchema = z.string().trim().min(1, "A reason is required");

/** MOD-006, MOD-007: every restriction requires a stated reason. */
export const issueAccountRestrictionSchema = z.object({
  userId: z.uuid(),
  restrictionType: accountRestrictionTypeSchema,
  reason: reasonSchema,
});
export type IssueAccountRestrictionInput = z.infer<
  typeof issueAccountRestrictionSchema
>;

export const liftAccountRestrictionSchema = z.object({
  restrictionId: z.uuid(),
  reason: reasonSchema,
});
export type LiftAccountRestrictionInput = z.infer<
  typeof liftAccountRestrictionSchema
>;

/** MOD-003: hiding anything requires a stated reason, same as a restriction. */
export const setContentHiddenSchema = z.object({
  targetId: z.uuid(),
  hidden: z.boolean(),
  reason: reasonSchema,
});
export type SetContentHiddenInput = z.infer<typeof setContentHiddenSchema>;

/** MOD-004. */
export const mergeDuplicateCasesSchema = z.object({
  sourceCaseId: z.uuid(),
  targetCaseId: z.uuid(),
  reason: reasonSchema,
});
export type MergeDuplicateCasesInput = z.infer<
  typeof mergeDuplicateCasesSchema
>;

/** MOD-005/MOD-010. */
export const redactCaseSensitiveInfoSchema = z.object({
  caseId: z.uuid(),
  reason: reasonSchema,
});
export type RedactCaseSensitiveInfoInput = z.infer<
  typeof redactCaseSensitiveInfoSchema
>;

/** Case status correction reuses transition_case_status; the dashboard
 * only needs the target status and a reason. */
export const correctCaseStatusSchema = z.object({
  caseId: z.uuid(),
  newStatus: caseStatusSchema,
  reason: reasonSchema,
});
export type CorrectCaseStatusInput = z.infer<typeof correctCaseStatusSchema>;

export const updateContentReportStatusSchema = z.object({
  reportId: z.uuid(),
  status: contentReportStatusSchema,
});
export type UpdateContentReportStatusInput = z.infer<
  typeof updateContentReportStatusSchema
>;

/** MOD-008. */
export const createModerationAppealSchema = z.object({
  restrictionId: z.uuid(),
  statement: z.string().trim().min(1, "A statement is required").max(2000),
});
export type CreateModerationAppealInput = z.infer<
  typeof createModerationAppealSchema
>;

export const reviewModerationAppealSchema = z.object({
  appealId: z.uuid(),
  status: appealStatusSchema,
  decisionReason: z.string().trim().max(1000).optional(),
});
export type ReviewModerationAppealInput = z.infer<
  typeof reviewModerationAppealSchema
>;

/** PRD 24 "configurable alert radii" - alert_escalation_steps is the
 * live ladder (Part 11); only administrators may write it. */
export const alertEscalationStepSchema = z.object({
  urgency: z.enum(["critical", "urgent"]),
  step: z.number().int().min(1),
  radiusKm: z.number().positive(),
  afterMinutes: z.number().int().min(0),
});
export type AlertEscalationStepInput = z.infer<
  typeof alertEscalationStepSchema
>;

/** Admin-configurable system content (PRD 24 "বাংলা and English system
 * content management"). */
export const animalTypeSchema = z.object({
  slug: z.string().trim().min(1),
  labelEn: z.string().trim().min(1),
  labelBn: z.string().trim().min(1),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type AnimalTypeInput = z.infer<typeof animalTypeSchema>;
