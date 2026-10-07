import { describe, expect, it } from "vitest";
import { containsPersonalContactInfo } from "../privacy";

describe("containsPersonalContactInfo", () => {
  it("flags a Bangladesh mobile number in any common spacing or prefix form", () => {
    expect(containsPersonalContactInfo("call me at 01711223344")).toBe(true);
    expect(containsPersonalContactInfo("+880 1711-223344 is my number")).toBe(
      true,
    );
    expect(containsPersonalContactInfo("8801711223344")).toBe(true);
  });

  it("flags an email address", () => {
    expect(containsPersonalContactInfo("reach me at a.b@example.com")).toBe(
      true,
    );
  });

  it("flags a long generic digit run that reads as a phone number", () => {
    expect(containsPersonalContactInfo("my number is 555-123-4567")).toBe(true);
  });

  it("does not flag ordinary rescue-report text", () => {
    expect(
      containsPersonalContactInfo(
        "The dog is near the market, limping on its front leg.",
      ),
    ).toBe(false);
  });

  it("does not flag a short reference-like number", () => {
    expect(containsPersonalContactInfo("case #4521 looks similar")).toBe(false);
  });
});
