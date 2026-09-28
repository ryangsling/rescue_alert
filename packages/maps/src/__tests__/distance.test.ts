import { describe, expect, it } from "vitest";
import {
  formatApproximateDistance,
  haversineDistanceMeters,
} from "../distance";

describe("haversineDistanceMeters", () => {
  it("returns 0 for the same point", () => {
    const point = { latitude: 23.75, longitude: 90.39 };
    expect(haversineDistanceMeters(point, point)).toBe(0);
  });

  it("matches the known ~111.19km-per-degree-of-latitude reference distance at the equator", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 1, longitude: 0 };
    // Earth's circumference / 360, for this function's own sphere
    // radius (6371000m) - an independently derivable reference value,
    // not just re-asserting whatever the function happens to output.
    const expected = (2 * Math.PI * 6371000) / 360;
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(expected, 0);
  });
});

describe("formatApproximateDistance", () => {
  it("rounds sub-kilometer distances to the nearest 50m and uses meters", () => {
    expect(formatApproximateDistance(430, "en")).toBe("~450 m");
    expect(formatApproximateDistance(10, "en")).toBe("~50 m");
  });

  it("uses one decimal of kilometers above 1000m", () => {
    expect(formatApproximateDistance(2340, "en")).toBe("~2.3 km");
  });

  it("always prefixes with ~ so the label never reads as exact", () => {
    expect(formatApproximateDistance(500, "en").startsWith("~")).toBe(true);
    expect(formatApproximateDistance(5000, "bn").startsWith("~")).toBe(true);
  });
});
