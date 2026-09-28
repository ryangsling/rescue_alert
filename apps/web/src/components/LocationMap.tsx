"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LocationList } from "./LocationList";
import type { LocationMapMarker } from "./mapTypes";

export type { LocationMapMarker } from "./mapTypes";

export interface LocationMapProps {
  markers: LocationMapMarker[];
  /** Overrides the default OpenFreeMap style - MAP-006. */
  styleUrlOverride?: string | null;
  className?: string;
}

// ssr: false + rendered only once `mode === "map"` is a deliberate
// double guard: it satisfies "defer map loading until the user opens
// map mode" (Part 9 task list) and avoids the same class of
// window-less-Node-SSR crash this session already hit for AsyncStorage
// and expo-sqlite - maplibre-gl touches browser globals at
// construction time, so it must never run during Next's server render.
const MapCanvas = dynamic(
  () => import("./MapCanvas").then((mod) => mod.MapCanvas),
  { ssr: false },
);

/**
 * DESIGN.md 12.3's list/map toggle, plus the Part 9 success criterion
 * that the list must be fully usable without ever loading a map -
 * list is the default mode, not map.
 */
export function LocationMap({
  markers,
  styleUrlOverride,
  className,
}: LocationMapProps) {
  const [mode, setMode] = useState<"list" | "map">("list");

  return (
    <div className={className}>
      <div
        className="mb-2 flex gap-2"
        role="tablist"
        aria-label="Map view mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          onClick={() => setMode("list")}
          className={[
            "min-h-11 rounded-full border px-4 py-2 text-text",
            mode === "list"
              ? "border-primary bg-primary-container"
              : "border-border",
          ].join(" ")}
        >
          List
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "map"}
          onClick={() => setMode("map")}
          className={[
            "min-h-11 rounded-full border px-4 py-2 text-text",
            mode === "map"
              ? "border-primary bg-primary-container"
              : "border-border",
          ].join(" ")}
        >
          Map
        </button>
      </div>

      {mode === "list" ? (
        <LocationList markers={markers} />
      ) : (
        <div className="h-80 w-full">
          <MapCanvas markers={markers} styleUrlOverride={styleUrlOverride} />
        </div>
      )}
    </div>
  );
}
