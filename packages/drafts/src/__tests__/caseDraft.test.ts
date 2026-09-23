import { describe, expect, it } from "vitest";
import { caseDraftSchema, createEmptyDraft } from "../caseDraft";

describe("createEmptyDraft", () => {
  it("starts at step 1 with no media and matching created/updated timestamps", () => {
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    expect(draft.currentStep).toBe(1);
    expect(draft.localMediaUris).toEqual([]);
    expect(draft.createdAt).toBe(draft.updatedAt);
  });

  it("produces a draft that satisfies its own schema", () => {
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    expect(caseDraftSchema.safeParse(draft).success).toBe(true);
  });
});

describe("caseDraftSchema", () => {
  it("accepts a partially-filled draft (only step 1's fields set)", () => {
    const draft = {
      ...createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4"),
      incidentType: "injured_animal",
      urgency: "urgent",
    };
    expect(caseDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("accepts a fully-filled draft matching all seven steps", () => {
    const draft = {
      ...createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4"),
      currentStep: 7,
      incidentType: "injured_animal",
      urgency: "urgent",
      animalTypeId: "c9455f13-2062-452c-9deb-be06e4bc0668",
      description: "Limping dog",
      location: { latitude: 23.7461, longitude: 90.3742 },
      landmark: "Dhanmondi Lake gate 4",
      creatorOnSite: true,
      localMediaUris: ["file:///tmp/photo1.jpg"],
    };
    expect(caseDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("rejects a step number outside 1-7", () => {
    const draft = {
      ...createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4"),
      currentStep: 8,
    };
    expect(caseDraftSchema.safeParse(draft).success).toBe(false);
  });

  it("rejects an invalid incident type", () => {
    const draft = {
      ...createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4"),
      incidentType: "not_a_real_type",
    };
    expect(caseDraftSchema.safeParse(draft).success).toBe(false);
  });
});
