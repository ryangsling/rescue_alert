import { View } from "react-native";
import {
  Camera,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
} from "@maplibre/maplibre-react-native";
import { Text } from "@rescue-alert/ui";
import {
  MAP_ATTRIBUTION_LINKS,
  MAP_ATTRIBUTION_TEXT,
  MAP_MARKER_STYLES,
  getMapStyleUrl,
  type LocationMapMarker,
} from "@rescue-alert/maps";
import { MapMarkerGlyph } from "./MapMarkerGlyph";

/**
 * Mirrors apps/web/src/components/MapCanvas.tsx. Same reasoning for
 * disabling the built-in attribution control: the OpenFreeMap
 * "liberty" style JSON has no `attribution` field at all (proven
 * directly against the live style on the web side), so MapLibre's own
 * attribution button would show nothing useful - MAP_ATTRIBUTION_TEXT
 * is rendered as an explicit overlay instead, same as web.
 *
 * No simulator or device is available in this environment (this
 * session's established mobile limitation), so this component is
 * verified by typecheck, lint, and Jest with the native module
 * mocked - never run against a real MapLibre Native renderer.
 */
export function MapCanvas({
  markers,
  styleUrlOverride,
}: {
  markers: LocationMapMarker[];
  styleUrlOverride?: string | null;
}) {
  const center: [number, number] =
    markers.length > 0
      ? [markers[0]!.position.longitude, markers[0]!.position.latitude]
      : [90.4125, 23.8103]; // Dhaka, pending any real marker to center on

  return (
    <View className="relative h-full w-full overflow-hidden rounded-medium">
      <MapLibreMap
        mapStyle={getMapStyleUrl(styleUrlOverride)}
        attribution={false}
        style={{ flex: 1 }}
      >
        <Camera
          initialViewState={{
            center,
            zoom: markers.length > 0 ? 13 : 10,
          }}
        />
        {markers.map((marker) => {
          const style = MAP_MARKER_STYLES[marker.type];
          return (
            <MapLibreMarker
              key={marker.id}
              id={marker.id}
              lngLat={[marker.position.longitude, marker.position.latitude]}
            >
              <MapMarkerGlyph
                colorToken={style.colorToken}
                label={style.label}
              />
            </MapLibreMarker>
          );
        })}
      </MapLibreMap>
      <View className="absolute bottom-1 right-1 rounded bg-surface/80 px-2 py-0.5">
        <Text
          variant="caption"
          tone="muted"
          accessibilityLabel={MAP_ATTRIBUTION_TEXT}
        >
          {`OpenFreeMap ${MAP_ATTRIBUTION_LINKS[0].label} Data from ${MAP_ATTRIBUTION_LINKS[1].label}`}
        </Text>
      </View>
    </View>
  );
}
