import {
  buildExternalNavigationUrls,
  MAP_MARKER_STYLES,
} from "@rescue-alert/maps";
import { MapMarkerGlyph } from "./MapMarkerGlyph";
import type { LocationMapMarker } from "./mapTypes";

/**
 * DESIGN.md 12.3 "list/map toggle" and the Part 9 success criterion
 * "the nearby list is fully usable without ever loading a map" - this
 * renders every marker's same information (type, label, external
 * navigation) as plain text and links, with no MapLibre/WebGL
 * dependency at all, so it also serves as the accessible equivalent
 * MAP task list calls for (a screen reader gets the same information
 * a sighted map view conveys).
 */
export function LocationList({ markers }: { markers: LocationMapMarker[] }) {
  if (markers.length === 0) {
    return <p className="text-text-muted">No locations to show.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {markers.map((marker) => {
        const style = MAP_MARKER_STYLES[marker.type];
        const nav = buildExternalNavigationUrls(marker.position, marker.label);
        return (
          <li
            key={marker.id}
            className="flex items-center gap-3 rounded-medium border border-border bg-surface p-3"
          >
            <MapMarkerGlyph colorToken={style.colorToken} label={style.label} />
            <div className="flex flex-1 flex-col">
              <span className="text-text">{marker.label}</span>
              <span className="text-xs text-text-muted">{style.label}</span>
            </div>
            <a
              href={nav.webFallback}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              Open in maps
            </a>
          </li>
        );
      })}
    </ul>
  );
}
