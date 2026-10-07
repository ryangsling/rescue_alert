import { z } from "zod";
import type { Database } from "@rescue-alert/types";

type AssistanceType = Database["public"]["Enums"]["assistance_type"];
type ResponseCommitmentStatus =
  Database["public"]["Enums"]["response_commitment_status"];

/** RESP-002. Kept as a literal array so Zod has a tuple to validate against. */
const ASSISTANCE_TYPES = [
  "on_site_rescue",
  "transport",
  "veterinary_treatment",
  "temporary_foster",
  "shelter_coordination",
  "case_coordination",
  "financial_support",
] as const satisfies readonly AssistanceType[];

type _AssertExhaustive<Literal extends string, Enum extends string> = [
  Enum extends Literal ? true : never,
  Literal extends Enum ? true : never,
];
const _assistanceTypesExhaustive: _AssertExhaustive<
  (typeof ASSISTANCE_TYPES)[number],
  AssistanceType
> = [true, true];
void _assistanceTypesExhaustive;

export const assistanceTypeSchema = z.enum(ASSISTANCE_TYPES);

/** RESP-001, RESP-002, RESP-003: the "I can help" action. */
export const createResponseSchema = z.object({
  caseId: z.uuid(),
  assistanceTypes: z.array(assistanceTypeSchema).min(1, "Choose at least one way you can help"),
  etaAt: z.iso.datetime().optional(),
  availabilityNote: z.string().trim().max(500).optional(),
});

export type CreateResponseInput = z.infer<typeof createResponseSchema>;

/** RESP-004: withdrawal always requires a stated reason - also enforced by a database CHECK constraint. */
export const withdrawResponseSchema = z.object({
  responseId: z.uuid(),
  reason: z.string().trim().min(1, "Let them know why you're withdrawing"),
});

export type WithdrawResponseInput = z.infer<typeof withdrawResponseSchema>;

/** The four status values a coordinator (never the responder themself) may set - see enforce_case_response_rules(). */
const COORDINATOR_SETTABLE_STATUSES = [
  "confirmed",
  "completed",
  "declined",
  "unresponsive",
] as const satisfies readonly ResponseCommitmentStatus[];

export const coordinatorResponseStatusSchema = z.enum(
  COORDINATOR_SETTABLE_STATUSES,
);

export const updateResponseStatusSchema = z.object({
  responseId: z.uuid(),
  status: coordinatorResponseStatusSchema,
});

export type UpdateResponseStatusInput = z.infer<
  typeof updateResponseStatusSchema
>;
