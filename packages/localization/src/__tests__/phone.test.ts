import { describe, expect, it } from "vitest";
import { formatPhoneForDisplay } from "../phone";

describe("formatPhoneForDisplay", () => {
  it("groups a normalized number as +880 1XXX-XXXXXX", () => {
    expect(formatPhoneForDisplay("+8801712345678")).toBe("+880 1712-345678");
  });

  it("returns the input unchanged if it is not the expected normalized shape", () => {
    expect(formatPhoneForDisplay("01712345678")).toBe("01712345678");
  });
});
