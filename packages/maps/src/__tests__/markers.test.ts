import { describe, expect, it } from "vitest";
import { MAP_MARKER_STYLES, markerTypeForCase } from "../markers";

describe("MAP_MARKER_STYLES", () => {
  it("defines exactly the seven marker types from DESIGN.md 12.1", () => {
    expect(Object.keys(MAP_MARKER_STYLES).sort()).toEqual(
      [
        "active_responder",
        "clinic_organization",
        "critical_case",
        "current_user",
        "resolved_case",
        "support_case",
        "urgent_case",
      ].sort(),
    );
  });
});

describe("markerTypeForCase", () => {
  it("returns resolved_case regardless of urgency once resolved or closed", () => {
    expect(markerTypeForCase("critical", "resolved")).toBe("resolved_case");
    expect(markerTypeForCase("support_needed", "closed")).toBe("resolved_case");
  });

  it("maps open critical and urgent urgency to their own marker", () => {
    expect(markerTypeForCase("critical", "open")).toBe("critical_case");
    expect(markerTypeForCase("urgent", "open")).toBe("urgent_case");
  });

  it("maps support_needed and adoption_community both to support_case", () => {
    expect(markerTypeForCase("support_needed", "open")).toBe("support_case");
    expect(markerTypeForCase("adoption_community", "open")).toBe(
      "support_case",
    );
  });
});
