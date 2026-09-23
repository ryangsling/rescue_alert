import { describe, expect, it } from "vitest";
import { normalizeBangladeshPhone } from "../phone";

describe("normalizeBangladeshPhone", () => {
  it.each([
    ["01712345678", "+8801712345678"],
    ["+8801712345678", "+8801712345678"],
    ["8801712345678", "+8801712345678"],
    ["1712345678", "+8801712345678"],
    ["01712-345678", "+8801712345678"],
    ["+880 1712 345 678", "+8801712345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeBangladeshPhone(input)).toBe(expected);
  });

  it.each([["12345"], ["+1234567890"], ["0271234567"], [""]])(
    "rejects %s as not a Bangladesh mobile number",
    (input) => {
      expect(normalizeBangladeshPhone(input)).toBeNull();
    },
  );
});
