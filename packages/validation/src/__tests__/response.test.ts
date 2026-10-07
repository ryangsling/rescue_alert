import { describe, expect, it } from "vitest";
import {
  createResponseSchema,
  withdrawResponseSchema,
  updateResponseStatusSchema,
} from "../response";

describe("createResponseSchema", () => {
  it("accepts a response with one or more assistance types", () => {
    const result = createResponseSchema.safeParse({
      caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
      assistanceTypes: ["on_site_rescue", "transport"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty assistance type list", () => {
    const result = createResponseSchema.safeParse({
      caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
      assistanceTypes: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown assistance type", () => {
    const result = createResponseSchema.safeParse({
      caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
      assistanceTypes: ["not_a_real_type"],
    });
    expect(result.success).toBe(false);
  });
});

describe("withdrawResponseSchema", () => {
  it("requires a non-empty reason", () => {
    expect(
      withdrawResponseSchema.safeParse({
        responseId: "c100f342-7586-458f-b912-f4db3934a1f4",
        reason: "",
      }).success,
    ).toBe(false);
    expect(
      withdrawResponseSchema.safeParse({
        responseId: "c100f342-7586-458f-b912-f4db3934a1f4",
        reason: "no longer able to help",
      }).success,
    ).toBe(true);
  });
});

describe("updateResponseStatusSchema", () => {
  it("accepts only the four coordinator-settable statuses", () => {
    for (const status of [
      "confirmed",
      "completed",
      "declined",
      "unresponsive",
    ]) {
      expect(
        updateResponseStatusSchema.safeParse({
          responseId: "c100f342-7586-458f-b912-f4db3934a1f4",
          status,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects committed and withdrawn - those are the responder's own transitions", () => {
    for (const status of ["committed", "withdrawn"]) {
      expect(
        updateResponseStatusSchema.safeParse({
          responseId: "c100f342-7586-458f-b912-f4db3934a1f4",
          status,
        }).success,
      ).toBe(false);
    }
  });
});
