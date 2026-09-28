/**
 * MAP-006: "Map provider configuration must be remotely changeable."
 * This project has no live feature-flag/remote-config service wired
 * up (see AGENTS.md's Technical Decisions) - "remotely changeable" is
 * implemented as an environment variable read at deploy time, which
 * satisfies the plan's own success criterion ("switching tile
 * provider requires configuration only, no code change"). Swapping to
 * a self-hosted Protomaps/PMTiles instance (the fallback path PRD's
 * stack table keeps open) is then a deploy-time env change.
 *
 * Reading the env var itself is each app's job (`EXPO_PUBLIC_...` on
 * mobile, `NEXT_PUBLIC_...` on web use different bundler-injection
 * mechanisms), so this package only resolves the already-read value
 * against the default.
 */
export const DEFAULT_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export function getMapStyleUrl(overrideUrl?: string | null): string {
  return overrideUrl && overrideUrl.length > 0
    ? overrideUrl
    : DEFAULT_MAP_STYLE_URL;
}

/**
 * MAP-004: attribution must remain visible. OpenFreeMap's own
 * documentation (https://openfreemap.org/) states this exact wording
 * is required: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap".
 * MapLibre GL JS reads a style's own `attribution` field and renders
 * it automatically via its default AttributionControl; these
 * constants exist for the mobile renderer (MapLibre React Native's
 * attribution control behaves differently) and as a explicit fallback
 * everywhere, so attribution is never silently dropped by relying on
 * a library default alone.
 */
export const MAP_ATTRIBUTION_TEXT =
  "OpenFreeMap © OpenMapTiles Data from OpenStreetMap";

export const MAP_ATTRIBUTION_LINKS = [
  { label: "OpenMapTiles", url: "https://www.openmaptiles.org/" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/copyright" },
] as const;
