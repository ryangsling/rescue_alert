import { describe, expect, it } from "vitest";
import {
  createCommentSchema,
  createReplySchema,
  createCaseUpdateSchema,
} from "../comment";

describe("createCommentSchema", () => {
  it("rejects an empty or whitespace-only body", () => {
    expect(
      createCommentSchema.safeParse({
        caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
        body: "   ",
      }).success,
    ).toBe(false);
  });

  it("accepts a normal comment", () => {
    expect(
      createCommentSchema.safeParse({
        caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
        body: "I'm near this location, on my way",
      }).success,
    ).toBe(true);
  });
});

describe("createReplySchema", () => {
  it("requires a comment id and a body", () => {
    expect(
      createReplySchema.safeParse({
        commentId: "c100f342-7586-458f-b912-f4db3934a1f4",
        body: "thanks for the update",
      }).success,
    ).toBe(true);
  });
});

describe("createCaseUpdateSchema", () => {
  it("defaults isPinned to false", () => {
    const result = createCaseUpdateSchema.safeParse({
      caseId: "c100f342-7586-458f-b912-f4db3934a1f4",
      body: "vet has arrived on site",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPinned).toBe(false);
    }
  });
});
