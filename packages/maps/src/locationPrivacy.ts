/** DESIGN.md section 12.2, verbatim four states. */
export type LocationPrivacyState =
  "exact" | "approximate" | "hidden" | "expired";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface LocationPrivacyInput {
  /** Accepted responder, case coordinator, or moderator - AGENTS.md's "exact coordinates unlock on commitment" decision. Resolving this authorization is a real access-control decision left to the caller (RLS/case-role lookup), not this pure function. */
  hasExactAccess: boolean;
  approximateLocation: GeoPoint | null;
  exactLocation: GeoPoint | null;
  /**
   * PRD 10.10 "Temporary responder location" is explicitly post-MVP -
   * nothing in this codebase yet sets this field, so `resolveLocationPrivacyState`
   * can compute "expired" but no caller can currently produce it. Kept
   * here so the type is correct now rather than needing a breaking
   * change when Part 11+ implements live sharing.
   */
  liveShareExpiresAt: string | null;
}

export function resolveLocationPrivacyState(
  input: LocationPrivacyInput,
): LocationPrivacyState {
  if (
    input.liveShareExpiresAt &&
    Date.parse(input.liveShareExpiresAt) < Date.now()
  ) {
    return "expired";
  }
  if (input.hasExactAccess && input.exactLocation) {
    return "exact";
  }
  if (input.approximateLocation) {
    return "approximate";
  }
  return "hidden";
}
