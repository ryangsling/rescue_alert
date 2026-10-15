import { describe, expect, it } from "vitest";
import {
  closureOutcomeSchema,
  contributionCategorySchema,
  closeCaseSchema,
} from "../closure";

describe("closureOutcomeSchema / contributionCategorySchema", () => {
  it("accept every real enum value and reject an unknown one", () => {
    expect(closureOutcomeSchema.safeParse("successfully_rescued").success).toBe(
      true,
    );
    expect(closureOutcomeSchema.safeParse("made_up_outcome").success).toBe(
      false,
    );
    expect(
      contributionCategorySchema.safeParse("on_site_responder").success,
    ).toBe(true);
    expect(contributionCategorySchema.safeParse("made_up").success).toBe(false);
  });
});

describe("closeCaseSchema", () => {
  const base = {
    caseId: "11111111-1111-4111-8111-111111111111",
    outcome: "successfully_rescued" as const,
    finalUpdate: "The dog was treated and released back to its area.",
  };

  it("accepts the minimal required shape", () => {
    expect(closeCaseSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an empty final update - OUT-002 requires one to close", () => {
    const result = closeCaseSchema.safeParse({ ...base, finalUpdate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid outcome", () => {
    const result = closeCaseSchema.safeParse({
      ...base,
      outcome: "not_a_real_outcome",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional contributions with a valid category each", () => {
    const result = closeCaseSchema.safeParse({
      ...base,
      contributions: [
        {
          userId: "22222222-2222-4222-8222-222222222222",
          category: "transport_volunteer",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a contribution with an invalid category", () => {
    const result = closeCaseSchema.safeParse({
      ...base,
      contributions: [
        { userId: "22222222-2222-4222-8222-222222222222", category: "nope" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
