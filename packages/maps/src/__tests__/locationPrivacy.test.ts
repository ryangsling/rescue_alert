import { describe, expect, it } from "vitest";
import { resolveLocationPrivacyState } from "../locationPrivacy";

const POINT = { latitude: 23.75, longitude: 90.39 };

describe("resolveLocationPrivacyState", () => {
  it("returns hidden when no location is available at all", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: false,
        approximateLocation: null,
        exactLocation: null,
        liveShareExpiresAt: null,
      }),
    ).toBe("hidden");
  });

  it("returns approximate when only the approximate point is available", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: false,
        approximateLocation: POINT,
        exactLocation: POINT,
        liveShareExpiresAt: null,
      }),
    ).toBe("approximate");
  });

  it("returns approximate, not exact, when exact access has not been granted even if the exact coordinate is present", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: false,
        approximateLocation: POINT,
        exactLocation: POINT,
        liveShareExpiresAt: null,
      }),
    ).toBe("approximate");
  });

  it("returns exact only when access is granted and the exact coordinate exists", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: true,
        approximateLocation: POINT,
        exactLocation: POINT,
        liveShareExpiresAt: null,
      }),
    ).toBe("exact");
  });

  it("returns expired when a live share's expiry has passed, even with exact access", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: true,
        approximateLocation: POINT,
        exactLocation: POINT,
        liveShareExpiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).toBe("expired");
  });

  it("does not report expired for a live share whose expiry is still in the future", () => {
    expect(
      resolveLocationPrivacyState({
        hasExactAccess: true,
        approximateLocation: POINT,
        exactLocation: POINT,
        liveShareExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe("exact");
  });
});
