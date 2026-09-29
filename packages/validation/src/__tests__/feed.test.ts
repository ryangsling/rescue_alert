import { describe, expect, it } from "vitest";
import { feedFiltersSchema } from "../feed";

describe("feedFiltersSchema", () => {
  it("accepts an empty filter set, defaulting closed/limit/offset", () => {
    const result = feedFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeClosed).toBe(false);
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it("accepts a fully populated filter set", () => {
    const result = feedFiltersSchema.safeParse({
      viewerLocation: { latitude: 23.7461, longitude: 90.3742 },
      radiusMeters: 5000,
      animalTypeIds: ["c9455f13-2062-452c-9deb-be06e4bc0668"],
      incidentTypes: ["injured_animal"],
      searchText: "lake",
      since: "2026-01-01T00:00:00.000Z",
      includeClosed: true,
      limit: 10,
      offset: 20,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a limit above the 50/page server-side cap", () => {
    expect(feedFiltersSchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("rejects a negative offset", () => {
    expect(feedFiltersSchema.safeParse({ offset: -1 }).success).toBe(false);
  });

  it("rejects a radius beyond the sane upper bound", () => {
    expect(feedFiltersSchema.safeParse({ radiusMeters: 500_000 }).success).toBe(
      false,
    );
  });
});
