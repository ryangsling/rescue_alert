import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type ReportReason = Database["public"]["Enums"]["report_reason"];
type ReportTargetType = Database["public"]["Enums"]["report_target_type"];

/** MOD-001. Kept as a literal array so Zod has a tuple to validate against. */
const REPORT_REASONS = [
  "spam",
  "duplicate",
  "fraud",
  "cruelty",
  "graphic_content",
  "unsafe_advice",
  "harassment",
  "privacy_exposure",
  "other",
] as const satisfies readonly ReportReason[];

/** MOD-001: a reply is reported distinctly from the comment it replies to. */
const REPORT_TARGET_TYPES = [
  "case",
  "comment",
  "reply",
  "profile",
  "media",
] as const satisfies readonly ReportTargetType[];

type _AssertExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _reasonsExhaustive: _AssertExhaustive<
  (typeof REPORT_REASONS)[number],
  ReportReason
> = [true, true];
const _targetTypesExhaustive: _AssertExhaustive<
  (typeof REPORT_TARGET_TYPES)[number],
  ReportTargetType
> = [true, true];
void _reasonsExhaustive;
void _targetTypesExhaustive;

export const reportReasonSchema = z.enum(REPORT_REASONS);
export const reportTargetTypeSchema = z.enum(REPORT_TARGET_TYPES);

export const createContentReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.uuid(),
  reason: reportReasonSchema,
  details: z.string().trim().max(1000).optional(),
});

export type CreateContentReportInput = z.infer<
  typeof createContentReportSchema
>;
