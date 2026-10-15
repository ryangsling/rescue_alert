import { describe, expect, it } from "vitest";
import {
  organizationTypeSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationServiceSchema,
  organizationAvailabilitySchema,
  fosterProfileSchema,
  createPlacementRequestSchema,
  placementRequestDecisionSchema,
} from "../organization";

describe("organizationTypeSchema", () => {
  it("accepts every real org type and rejects an unknown one", () => {
    expect(organizationTypeSchema.safeParse("clinic").success).toBe(true);
    expect(organizationTypeSchema.safeParse("not_a_type").success).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("requires a non-empty name and a valid org type", () => {
    expect(
      createOrganizationSchema.safeParse({ name: "Test NGO", orgType: "ngo" })
        .success,
    ).toBe(true);
    expect(
      createOrganizationSchema.safeParse({ name: "", orgType: "ngo" }).success,
    ).toBe(false);
    expect(
      createOrganizationSchema.safeParse({ name: "Test", orgType: "nope" })
        .success,
    ).toBe(false);
  });
});

describe("updateOrganizationSchema", () => {
  it("allows every field to be omitted but enforces max lengths", () => {
    expect(updateOrganizationSchema.safeParse({}).success).toBe(true);
    expect(
      updateOrganizationSchema.safeParse({
        description: "a".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("organizationServiceSchema", () => {
  it("requires a non-empty service name", () => {
    expect(
      organizationServiceSchema.safeParse({ serviceName: "Deworming" }).success,
    ).toBe(true);
    expect(
      organizationServiceSchema.safeParse({ serviceName: "" }).success,
    ).toBe(false);
  });
});

describe("organizationAvailabilitySchema", () => {
  it("accepts empty opt-in arrays - no row means no dispatch, but opting into nothing explicitly is also valid", () => {
    const result = organizationAvailabilitySchema.safeParse({
      isCurrentlyAvailable: true,
      optedInUrgencyLevels: [],
      optedInIncidentTypes: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid urgency level in the opt-in list", () => {
    const result = organizationAvailabilitySchema.safeParse({
      isCurrentlyAvailable: true,
      optedInUrgencyLevels: ["not_a_level"],
      optedInIncidentTypes: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("fosterProfileSchema", () => {
  it("requires a positive integer capacity", () => {
    expect(
      fosterProfileSchema.safeParse({ capacity: 2, isActive: true }).success,
    ).toBe(true);
    expect(
      fosterProfileSchema.safeParse({ capacity: 0, isActive: true }).success,
    ).toBe(false);
  });
});

describe("createPlacementRequestSchema / placementRequestDecisionSchema", () => {
  it("require valid uuids and a valid decision value", () => {
    expect(
      createPlacementRequestSchema.safeParse({
        caseId: "11111111-1111-4111-8111-111111111111",
        fosterProfileId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
    expect(
      createPlacementRequestSchema.safeParse({
        caseId: "not-a-uuid",
        fosterProfileId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
    expect(placementRequestDecisionSchema.safeParse("approved").success).toBe(
      true,
    );
    expect(placementRequestDecisionSchema.safeParse("pending").success).toBe(
      false,
    );
  });
});
