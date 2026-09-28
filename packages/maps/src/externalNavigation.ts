import type { GeoPoint } from "./locationPrivacy";

export interface ExternalNavigationUrls {
  ios: string;
  android: string;
  /** Used on web, and as the last-resort fallback if a native scheme fails to open. */
  webFallback: string;
}

/**
 * MAP-003: "open coordinates in an installed mapping application."
 * Pure URL construction only - packages/maps has no platform APIs to
 * depend on, so actually opening one of these (`Linking.openURL` on
 * native, `window.open` on web) is each app's job. No built-in
 * turn-by-turn is implied or provided here (AGENTS.md limitations) -
 * these are hand-off URLs into whatever map app is already installed.
 */
export function buildExternalNavigationUrls(
  coords: GeoPoint,
  label?: string,
): ExternalNavigationUrls {
  const { latitude, longitude } = coords;
  const point = `${latitude},${longitude}`;
  const encodedLabel = label ? encodeURIComponent(label) : undefined;

  return {
    ios: encodedLabel
      ? `maps://?ll=${point}&q=${encodedLabel}`
      : `maps://?ll=${point}`,
    android: encodedLabel
      ? `geo:${point}?q=${point}(${encodedLabel})`
      : `geo:${point}?q=${point}`,
    webFallback: `https://www.google.com/maps/search/?api=1&query=${point}`,
  };
}
