// A deep import into the format submodule, not the package root -
// packages/maps has no React dependency, and @rescue-alert/localization's
// root index.ts re-exports LocaleContext.tsx (a React component),
// which fails to typecheck here with no JSX config. format.ts itself
// has no React import.
import { formatNumber } from "@rescue-alert/localization/src/format";
import type { GeoPoint } from "./locationPrivacy";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in meters. MAP-002 asks for straight-line distance only - this is deliberately not a routing distance. */
export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * MAP-002: "an appropriate approximation label", never presented as
 * exact. Rounds to the nearest 50m under 1km, and to one decimal km
 * above it, so the label itself signals it is not precise.
 */
export function formatApproximateDistance(
  meters: number,
  locale: "en" | "bn",
): string {
  if (meters < 1000) {
    const rounded = Math.max(50, Math.round(meters / 50) * 50);
    return `~${formatNumber(locale, rounded)} m`;
  }
  const km = Math.round((meters / 1000) * 10) / 10;
  return `~${formatNumber(locale, km)} km`;
}
