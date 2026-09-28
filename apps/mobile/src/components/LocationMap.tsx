import { useState } from "react";
import { Button, Stack } from "@rescue-alert/ui";
import type { LocationMapMarker } from "@rescue-alert/maps";
import { LocationList } from "./LocationList";
import { MapCanvas } from "./MapCanvas";

export interface LocationMapProps {
  markers: LocationMapMarker[];
  /** Overrides the default OpenFreeMap style - MAP-006. */
  styleUrlOverride?: string | null;
  className?: string;
}

/**
 * DESIGN.md 12.3's list/map toggle, plus the Part 9 success criterion
 * that the list must be fully usable without ever loading a map -
 * list is the default mode, not map. Mirrors apps/web/src/components/
 * LocationMap.tsx. Unlike web, this does not need an ssr-safe/deferred
 * dynamic import - there is no server render on native, and
 * MapLibre React Native is a real native module either way, so
 * "deferred until map mode" here means simply not mounting <MapCanvas>
 * until the user switches tabs, which the conditional render below
 * already does.
 */
export function LocationMap({
  markers,
  styleUrlOverride,
  className,
}: LocationMapProps) {
  const [mode, setMode] = useState<"list" | "map">("list");

  return (
    <Stack gap="2" className={className}>
      <Stack direction="row" gap="2">
        <Button
          variant={mode === "list" ? "primary" : "outline"}
          onPress={() => setMode("list")}
        >
          List
        </Button>
        <Button
          variant={mode === "map" ? "primary" : "outline"}
          onPress={() => setMode("map")}
        >
          Map
        </Button>
      </Stack>

      {mode === "list" ? (
        <LocationList markers={markers} />
      ) : (
        <Stack className="h-80 w-full">
          <MapCanvas markers={markers} styleUrlOverride={styleUrlOverride} />
        </Stack>
      )}
    </Stack>
  );
}
