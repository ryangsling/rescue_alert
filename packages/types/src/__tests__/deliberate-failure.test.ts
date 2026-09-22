import { describe, expect, it } from "vitest";

describe("CI wiring proof (temporary)", () => {
  it("deliberately fails to prove CI catches real failures", () => {
    expect(1 + 1).toBe(3);
  });
});
