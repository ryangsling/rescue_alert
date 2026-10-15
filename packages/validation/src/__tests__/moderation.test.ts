import { describe, expect, it } from "vitest";
import {
  accountRestrictionTypeSchema,
  contentReportStatusSchema,
  appealStatusSchema,
  caseStatusSchema,
  issueAccountRestrictionSchema,
  liftAccountRestrictionSchema,
  setContentHiddenSchema,
  mergeDuplicateCasesSchema,
  redactCaseSensitiveInfoSchema,
  correctCaseStatusSchema,
  updateContentReportStatusSchema,
  createModerationAppealSchema,
  reviewModerationAppealSchema,
  alertEscalationStepSchema,
  animalTypeSchema,
} from "../moderation";

const uuid1 = "11111111-1111-4111-8111-111111111111";
const uuid2 = "22222222-2222-4222-8222-222222222222";

describe("enum schemas", () => {
  it("each accept their real values and reject an unknown one", () => {
    expect(accountRestrictionTypeSchema.safeParse("suspended").success).toBe(
      true,
    );
    expect(accountRestrictionTypeSchema.safeParse("nope").success).toBe(false);
    expect(contentReportStatusSchema.safeParse("reviewing").success).toBe(true);
    expect(contentReportStatusSchema.safeParse("nope").success).toBe(false);
    expect(appealStatusSchema.safeParse("upheld").success).toBe(true);
    expect(appealStatusSchema.safeParse("pending").success).toBe(false);
    expect(caseStatusSchema.safeParse("closed_by_moderator").success).toBe(
      true,
    );
    expect(caseStatusSchema.safeParse("nope").success).toBe(false);
  });
});

describe("reason-requiring action schemas", () => {
  it("require a non-empty reason on every one (MOD-007)", () => {
    expect(
      issueAccountRestrictionSchema.safeParse({
        userId: uuid1,
        restrictionType: "warning",
        reason: "",
      }).success,
    ).toBe(false);
    expect(
      issueAccountRestrictionSchema.safeParse({
        userId: uuid1,
        restrictionType: "warning",
        reason: "repeated spam",
      }).success,
    ).toBe(true);

    expect(
      liftAccountRestrictionSchema.safeParse({
        restrictionId: uuid1,
        reason: "",
      }).success,
    ).toBe(false);

    expect(
      setContentHiddenSchema.safeParse({
        targetId: uuid1,
        hidden: true,
        reason: "",
      }).success,
    ).toBe(false);

    expect(
      mergeDuplicateCasesSchema.safeParse({
        sourceCaseId: uuid1,
        targetCaseId: uuid2,
        reason: "",
      }).success,
    ).toBe(false);

    expect(
      redactCaseSensitiveInfoSchema.safeParse({ caseId: uuid1, reason: "" })
        .success,
    ).toBe(false);

    expect(
      correctCaseStatusSchema.safeParse({
        caseId: uuid1,
        newStatus: "closed_by_moderator",
        reason: "",
      }).success,
    ).toBe(false);
  });
});

describe("updateContentReportStatusSchema", () => {
  it("requires a valid report id and status", () => {
    expect(
      updateContentReportStatusSchema.safeParse({
        reportId: uuid1,
        status: "resolved",
      }).success,
    ).toBe(true);
    expect(
      updateContentReportStatusSchema.safeParse({
        reportId: uuid1,
        status: "nope",
      }).success,
    ).toBe(false);
  });
});

describe("createModerationAppealSchema / reviewModerationAppealSchema", () => {
  it("require a non-empty statement capped at 2000 characters", () => {
    expect(
      createModerationAppealSchema.safeParse({
        restrictionId: uuid1,
        statement: "",
      }).success,
    ).toBe(false);
    expect(
      createModerationAppealSchema.safeParse({
        restrictionId: uuid1,
        statement: "a".repeat(2001),
      }).success,
    ).toBe(false);
    expect(
      createModerationAppealSchema.safeParse({
        restrictionId: uuid1,
        statement: "This was a mistake",
      }).success,
    ).toBe(true);
  });

  it("allows an optional decision reason on review", () => {
    expect(
      reviewModerationAppealSchema.safeParse({
        appealId: uuid1,
        status: "upheld",
      }).success,
    ).toBe(true);
    expect(
      reviewModerationAppealSchema.safeParse({
        appealId: uuid1,
        status: "nope",
      }).success,
    ).toBe(false);
  });
});

describe("alertEscalationStepSchema", () => {
  it("requires a positive radius and a non-negative delay", () => {
    expect(
      alertEscalationStepSchema.safeParse({
        urgency: "critical",
        step: 1,
        radiusKm: 2,
        afterMinutes: 0,
      }).success,
    ).toBe(true);
    expect(
      alertEscalationStepSchema.safeParse({
        urgency: "critical",
        step: 1,
        radiusKm: 0,
        afterMinutes: 0,
      }).success,
    ).toBe(false);
    expect(
      alertEscalationStepSchema.safeParse({
        urgency: "support_needed",
        step: 1,
        radiusKm: 2,
        afterMinutes: 0,
      }).success,
    ).toBe(false);
  });
});

describe("animalTypeSchema", () => {
  it("requires non-empty slug and both labels", () => {
    expect(
      animalTypeSchema.safeParse({
        slug: "dog",
        labelEn: "Dog",
        labelBn: "kukur",
        isActive: true,
        sortOrder: 1,
      }).success,
    ).toBe(true);
    expect(
      animalTypeSchema.safeParse({
        slug: "",
        labelEn: "Dog",
        labelBn: "kukur",
        isActive: true,
        sortOrder: 1,
      }).success,
    ).toBe(false);
  });
});
