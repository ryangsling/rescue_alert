import type { MapMarkerColorToken } from "@rescue-alert/maps";

export const MAP_MARKER_COLOR_CLASS: Record<MapMarkerColorToken, string> = {
  critical: "bg-critical",
  urgent: "bg-urgent",
  support: "bg-support",
  success: "bg-success",
  neutral: "bg-neutral",
  primary: "bg-primary",
};

/**
 * DESIGN.md 12.1: "Markers must include an outline so they remain
 * visible over varied map colors." The white ring plus a dark shadow
 * is that outline - a solid color dot alone would wash out on a
 * same-hue basemap area.
 */
export function MapMarkerGlyph({
  colorToken,
  label,
}: {
  colorToken: MapMarkerColorToken;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={[
        "h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]",
        MAP_MARKER_COLOR_CLASS[colorToken],
      ].join(" ")}
    />
  );
}
