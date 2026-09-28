import { Linking } from "react-native";
import { Stack, Text } from "@rescue-alert/ui";
import {
  buildExternalNavigationUrls,
  MAP_MARKER_STYLES,
  type LocationMapMarker,
} from "@rescue-alert/maps";
import { MapMarkerGlyph } from "./MapMarkerGlyph";

/**
 * DESIGN.md 12.3 list/map toggle and the Part 9 success criterion
 * "the nearby list is fully usable without ever loading a map" -
 * mirrors apps/web/src/components/LocationList.tsx. No MapLibre
 * dependency, so it also doubles as the accessible equivalent the
 * task list calls for.
 */
export function LocationList({ markers }: { markers: LocationMapMarker[] }) {
  if (markers.length === 0) {
    return <Text tone="muted">No locations to show.</Text>;
  }

  return (
    <Stack gap="2">
      {markers.map((marker) => {
        const style = MAP_MARKER_STYLES[marker.type];
        const nav = buildExternalNavigationUrls(marker.position, marker.label);
        return (
          <Stack
            key={marker.id}
            direction="row"
            align="center"
            gap="3"
            className="rounded-medium border border-border bg-surface p-3"
          >
            <MapMarkerGlyph colorToken={style.colorToken} label={style.label} />
            <Stack className="flex-1">
              <Text>{marker.label}</Text>
              <Text variant="caption" tone="muted">
                {style.label}
              </Text>
            </Stack>
            <Text
              accessibilityRole="link"
              className="text-primary"
              onPress={() => Linking.openURL(nav.webFallback)}
            >
              Open in maps
            </Text>
          </Stack>
        );
      })}
    </Stack>
  );
}
