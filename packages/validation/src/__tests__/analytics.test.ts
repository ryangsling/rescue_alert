import { describe, expect, it } from "vitest";
import {
  analyticsEventNameSchema,
  recordAnalyticsEventSchema,
} from "../analytics";

describe("analyticsEventNameSchema", () => {
  it("accepts a known event name", () => {
    expect(analyticsEventNameSchema.safeParse("report_submitted").success).toBe(
      true,
    );
  });

  it("rejects an arbitrary string", () => {
    expect(analyticsEventNameSchema.safeParse("made_up_event").success).toBe(
      false,
    );
  });
});

describe("recordAnalyticsEventSchema", () => {
  it("accepts an event with no properties", () => {
    const result = recordAnalyticsEventSchema.safeParse({
      eventName: "case_closed",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an event with structured properties", () => {
    const result = recordAnalyticsEventSchema.safeParse({
      eventName: "report_submitted",
      properties: { incidentType: "injured_animal" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown event name", () => {
    const result = recordAnalyticsEventSchema.safeParse({
      eventName: "something_else",
    });
    expect(result.success).toBe(false);
  });
});
