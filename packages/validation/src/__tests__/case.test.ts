import { describe, expect, it } from "vitest";
import { createCaseSchema } from "../case";

const validCase = {
  idempotencyKey: "c100f342-7586-458f-b912-f4db3934a1f4",
  incidentType: "injured_animal" as const,
  urgency: "urgent" as const,
  animalTypeId: "c9455f13-2062-452c-9deb-be06e4bc0668",
  description: "Limping dog near the market",
  location: { latitude: 23.7461, longitude: 90.3742 },
  landmark: "Dhanmondi Lake gate 4",
  division: "Dhaka",
  district: "Dhaka",
  upazilaOrThana: "Dhanmondi",
  creatorOnSite: true,
};

describe("createCaseSchema", () => {
  it("accepts a fully valid case", () => {
    expect(createCaseSchema.safeParse(validCase).success).toBe(true);
  });

  it("accepts a case with only the CASE-002 required fields", () => {
    const minimal = {
      idempotencyKey: validCase.idempotencyKey,
      incidentType: validCase.incidentType,
      urgency: validCase.urgency,
      description: validCase.description,
      location: validCase.location,
      creatorOnSite: false,
    };
    expect(createCaseSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects an empty description", () => {
    expect(
      createCaseSchema.safeParse({ ...validCase, description: "  " }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range latitude", () => {
    expect(
      createCaseSchema.safeParse({
        ...validCase,
        location: { latitude: 200, longitude: 90 },
      }).success,
    ).toBe(false);
  });

  it("rejects an incident type not in PRD 8.1's list", () => {
    expect(
      createCaseSchema.safeParse({ ...validCase, incidentType: "made_up" })
        .success,
    ).toBe(false);
  });

  it("rejects a non-UUID idempotency key", () => {
    expect(
      createCaseSchema.safeParse({ ...validCase, idempotencyKey: "not-a-uuid" })
        .success,
    ).toBe(false);
  });
});
