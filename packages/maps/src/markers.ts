import type { GeoPoint } from "./locationPrivacy";

/** A single positioned marker, the shape both apps' map components take as input. */
export interface LocationMapMarker {
  id: string;
  type: MapMarkerType;
  position: GeoPoint;
  label: string;
}

/** design/DESIGN.md section 12.1's seven marker types, verbatim. */
export type MapMarkerType =
  | "critical_case"
  | "urgent_case"
  | "support_case"
  | "resolved_case"
  | "current_user"
  | "active_responder"
  | "clinic_organization";

export type MapMarkerShape =
  "pin" | "check_pin" | "dot" | "navigation" | "building";

/**
 * "primary" is not one of packages/ui's StatusChipTone values (which
 * cover only the six status colors) - it is added here because
 * DESIGN.md's marker table names a "Teal navigation marker" for the
 * active responder, distinct from any status tone, and the project's
 * primary color token is itself a teal (design/DESIGN.md section 5.1).
 * packages/maps cannot
 * depend on packages/ui (React Native-only), so this type is declared
 * independently rather than imported, but intentionally uses the same
 * token names each app's own `bg-*`/`text-*` classes already use.
 */
export type MapMarkerColorToken =
  "critical" | "urgent" | "support" | "success" | "neutral" | "primary";

export interface MapMarkerStyle {
  label: string;
  colorToken: MapMarkerColorToken;
  shape: MapMarkerShape;
}

/** DESIGN.md 12.1 table, one row per marker type. Every marker needs an outline so it stays visible over varied map colors - each app's renderer is responsible for that, not this metadata. */
export const MAP_MARKER_STYLES: Record<MapMarkerType, MapMarkerStyle> = {
  critical_case: {
    label: "Critical case",
    colorToken: "critical",
    shape: "pin",
  },
  urgent_case: { label: "Urgent case", colorToken: "urgent", shape: "pin" },
  support_case: { label: "Support case", colorToken: "support", shape: "pin" },
  resolved_case: {
    label: "Resolved case",
    colorToken: "success",
    shape: "check_pin",
  },
  current_user: { label: "Current user", colorToken: "support", shape: "dot" },
  active_responder: {
    label: "Active responder",
    colorToken: "primary",
    shape: "navigation",
  },
  clinic_organization: {
    label: "Clinic or organization",
    colorToken: "neutral",
    shape: "building",
  },
};

type CaseUrgency =
  "critical" | "urgent" | "support_needed" | "adoption_community";
type CaseStatusForMarker = "resolved" | "closed" | (string & {});

/**
 * DESIGN.md's marker table has exactly one non-resolved case marker
 * per PRD urgency tier below critical/urgent - `support_needed` and
 * `adoption_community` both render as the neutral "support" pin,
 * since there is no fourth case-marker row for the lowest,
 * no-emergency urgency tier (PRD 8.2: "no emergency notification").
 */
export function markerTypeForCase(
  urgency: CaseUrgency,
  status: CaseStatusForMarker,
): MapMarkerType {
  if (status === "resolved" || status === "closed") return "resolved_case";
  if (urgency === "critical") return "critical_case";
  if (urgency === "urgent") return "urgent_case";
  return "support_case";
}
