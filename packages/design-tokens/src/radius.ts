/**
 * Rescue UI corner radius tokens, in pixels. design/DESIGN.md
 * section 8.1. `full` is reserved for avatars and circular icon
 * buttons only - do not make every container pill-shaped.
 */
export const radius = {
  none: 0,
  small: 6,
  medium: 10,
  large: 14,
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;
