"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MAP_ATTRIBUTION_LINKS,
  MAP_ATTRIBUTION_TEXT,
  MAP_MARKER_STYLES,
  getMapStyleUrl,
} from "@rescue-alert/maps";
import type { LocationMapMarker } from "./mapTypes";
import { MAP_MARKER_COLOR_CLASS } from "./MapMarkerGlyph";

/**
 * Proven directly against the live style JSON (curl
 * https://tiles.openfreemap.org/styles/liberty), not assumed from
 * OpenFreeMap's own docs claim ("if you are using MapLibre, [credits]
 * are automatically added") - that style has no top-level or
 * per-source `attribution` field at all, so MapLibre GL JS's default
 * AttributionControl would render an empty, effectively invisible
 * control. attributionControl is disabled here and MAP_ATTRIBUTION_TEXT
 * is rendered as our own persistent overlay instead, so MAP-004
 * ("attribution must remain visible") does not depend on an upstream
 * style ever adding that field.
 */
export function MapCanvas({
  markers,
  styleUrlOverride,
}: {
  markers: LocationMapMarker[];
  styleUrlOverride?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: getMapStyleUrl(styleUrlOverride),
      center:
        markers.length > 0
          ? [markers[0]!.position.longitude, markers[0]!.position.latitude]
          : [90.4125, 23.8103], // Dhaka, pending any real marker to center on
      zoom: markers.length > 0 ? 13 : 10,
      attributionControl: false,
    });
    mapRef.current = map;

    const markerInstances = markers.map((markerData) => {
      const style = MAP_MARKER_STYLES[markerData.type];
      const el = document.createElement("div");
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", markerData.label);
      el.className = [
        "h-4 w-4 rounded-full border-2 border-white",
        MAP_MARKER_COLOR_CLASS[style.colorToken],
      ].join(" ");
      el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.35)";

      return new MapLibreMarker({ element: el })
        .setLngLat([
          markerData.position.longitude,
          markerData.position.latitude,
        ])
        .addTo(map);
    });

    return () => {
      markerInstances.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-initializing the whole map on every marker array identity change would tear down and reload tiles constantly; this component is expected to remount (via `key`) when its marker set meaningfully changes.
  }, [styleUrlOverride]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-medium">
      <div ref={containerRef} className="h-full w-full" />
      <div
        className="absolute bottom-1 right-1 rounded bg-surface/80 px-2 py-0.5 text-xs text-text-muted"
        aria-label={MAP_ATTRIBUTION_TEXT}
      >
        {"OpenFreeMap "}
        <a
          href={MAP_ATTRIBUTION_LINKS[0].url}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {MAP_ATTRIBUTION_LINKS[0].label}
        </a>
        {" Data from "}
        <a
          href={MAP_ATTRIBUTION_LINKS[1].url}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {MAP_ATTRIBUTION_LINKS[1].label}
        </a>
      </div>
    </div>
  );
}
