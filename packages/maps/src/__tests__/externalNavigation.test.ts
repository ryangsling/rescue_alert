import { describe, expect, it } from "vitest";
import { buildExternalNavigationUrls } from "../externalNavigation";

const COORDS = { latitude: 23.75, longitude: 90.39 };

describe("buildExternalNavigationUrls", () => {
  it("builds a maps:// URL for iOS", () => {
    const urls = buildExternalNavigationUrls(COORDS);
    expect(urls.ios).toBe("maps://?ll=23.75,90.39");
  });

  it("builds a geo: URL for Android", () => {
    const urls = buildExternalNavigationUrls(COORDS);
    expect(urls.android).toBe("geo:23.75,90.39?q=23.75,90.39");
  });

  it("builds a Google Maps search URL as the web fallback", () => {
    const urls = buildExternalNavigationUrls(COORDS);
    expect(urls.webFallback).toBe(
      "https://www.google.com/maps/search/?api=1&query=23.75,90.39",
    );
  });

  it("includes an encoded label in the query when one is given", () => {
    const urls = buildExternalNavigationUrls(COORDS, "Dhanmondi Lake");
    expect(urls.ios).toBe("maps://?ll=23.75,90.39&q=Dhanmondi%20Lake");
    expect(urls.android).toBe(
      "geo:23.75,90.39?q=23.75,90.39(Dhanmondi%20Lake)",
    );
  });
});
