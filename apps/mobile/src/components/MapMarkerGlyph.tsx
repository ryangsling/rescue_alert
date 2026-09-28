import { View } from "react-native";
import type { MapMarkerColorToken } from "@rescue-alert/maps";

export const MAP_MARKER_COLOR_CLASS: Record<MapMarkerColorToken, string> = {
  critical: "bg-critical",
  urgent: "bg-urgent",
  support: "bg-support",
  success: "bg-success",
  neutral: "bg-neutral",
  primary: "bg-primary",
};

/** design/DESIGN.md 12.1: markers need an outline so they stay visible over varied map colors - the white ring is that outline. Mirrors apps/web/src/components/MapMarkerGlyph.tsx. */
export function MapMarkerGlyph({
  colorToken,
  label,
}: {
  colorToken: MapMarkerColorToken;
  label: string;
}) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      className={[
        "h-4 w-4 rounded-full border-2 border-white",
        MAP_MARKER_COLOR_CLASS[colorToken],
      ].join(" ")}
    />
  );
}
