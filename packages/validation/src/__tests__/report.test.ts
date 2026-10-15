import { describe, expect, it } from "vitest";
import {
  reportReasonSchema,
  reportTargetTypeSchema,
  createContentReportSchema,
} from "../report";

describe("reportReasonSchema / reportTargetTypeSchema", () => {
  it("accept every real enum value and reject an unknown one", () => {
    expect(reportReasonSchema.safeParse("harassment").success).toBe(true);
    expect(reportReasonSchema.safeParse("not_a_reason").success).toBe(false);
    expect(reportTargetTypeSchema.safeParse("reply").success).toBe(true);
    expect(reportTargetTypeSchema.safeParse("not_a_target").success).toBe(
      false,
    );
  });
});

describe("createContentReportSchema", () => {
  const base = {
    targetType: "comment" as const,
    targetId: "11111111-1111-4111-8111-111111111111",
    reason: "spam" as const,
  };

  it("accepts the minimal required shape", () => {
    expect(createContentReportSchema.safeParse(base).success).toBe(true);
  });

  it("accepts optional details up to 1000 characters", () => {
    const result = createContentReportSchema.safeParse({
      ...base,
      details: "a".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects details beyond 1000 characters", () => {
    const result = createContentReportSchema.safeParse({
      ...base,
      details: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid reason or target type", () => {
    expect(
      createContentReportSchema.safeParse({ ...base, reason: "nope" }).success,
    ).toBe(false);
    expect(
      createContentReportSchema.safeParse({ ...base, targetType: "nope" })
        .success,
    ).toBe(false);
  });
});
