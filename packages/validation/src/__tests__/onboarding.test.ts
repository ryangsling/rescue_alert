import { describe, expect, it } from "vitest";
import {
  onboardingCapabilitiesSchema,
  onboardingPreferencesSchema,
} from "../onboarding";

describe("onboardingCapabilitiesSchema", () => {
  it("accepts a subset of valid capabilities", () => {
    const result = onboardingCapabilitiesSchema.safeParse({
      capabilities: ["on_site_rescue", "transport"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults to an empty list when omitted", () => {
    const result = onboardingCapabilitiesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capabilities).toEqual([]);
    }
  });

  it("rejects a capability not in the database enum", () => {
    const result = onboardingCapabilitiesSchema.safeParse({
      capabilities: ["not_a_real_capability"],
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingPreferencesSchema", () => {
  it("accepts a positive alert radius within bounds", () => {
    expect(
      onboardingPreferencesSchema.safeParse({
        preferredAnimalTypeIds: [],
        alertRadiusKm: 5,
      }).success,
    ).toBe(true);
  });

  it("rejects a non-positive alert radius", () => {
    expect(
      onboardingPreferencesSchema.safeParse({
        preferredAnimalTypeIds: [],
        alertRadiusKm: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects an alert radius above the pilot's 25km bound", () => {
    expect(
      onboardingPreferencesSchema.safeParse({
        preferredAnimalTypeIds: [],
        alertRadiusKm: 26,
      }).success,
    ).toBe(false);
  });
});
