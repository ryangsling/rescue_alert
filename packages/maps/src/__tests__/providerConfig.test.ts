import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_STYLE_URL,
  getMapStyleUrl,
  MAP_ATTRIBUTION_TEXT,
} from "../providerConfig";

describe("getMapStyleUrl", () => {
  it("falls back to the OpenFreeMap default when no override is given", () => {
    expect(getMapStyleUrl(undefined)).toBe(DEFAULT_MAP_STYLE_URL);
    expect(getMapStyleUrl(null)).toBe(DEFAULT_MAP_STYLE_URL);
    expect(getMapStyleUrl("")).toBe(DEFAULT_MAP_STYLE_URL);
  });

  it("uses the override when one is provided, e.g. a self-hosted instance", () => {
    expect(getMapStyleUrl("https://tiles.example.com/styles/custom")).toBe(
      "https://tiles.example.com/styles/custom",
    );
  });
});

describe("MAP_ATTRIBUTION_TEXT", () => {
  it("matches OpenFreeMap's required wording exactly", () => {
    expect(MAP_ATTRIBUTION_TEXT).toBe(
      "OpenFreeMap © OpenMapTiles Data from OpenStreetMap",
    );
  });
});
