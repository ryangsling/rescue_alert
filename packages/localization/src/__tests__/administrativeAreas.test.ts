import { describe, expect, it } from "vitest";
import { administrativeDivisions } from "../administrativeAreas";

describe("administrativeDivisions", () => {
  it("lists all 8 divisions with unique ids", () => {
    expect(administrativeDivisions).toHaveLength(8);
    expect(new Set(administrativeDivisions.map((d) => d.id)).size).toBe(8);
  });

  it("includes Dhaka, since the MVP pilot is a constrained Dhaka area", () => {
    expect(
      administrativeDivisions.some((d) => d.id === "dhaka" && d.bn === "ঢাকা"),
    ).toBe(true);
  });

  it("has non-empty bn and en labels for every division", () => {
    for (const division of administrativeDivisions) {
      expect(division.en.length).toBeGreaterThan(0);
      expect(division.bn.length).toBeGreaterThan(0);
    }
  });
});
