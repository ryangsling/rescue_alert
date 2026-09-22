/**
 * Rescue UI elevation tokens. design/DESIGN.md section 8.2.
 *
 * "Prefer borders and surface contrast over heavy shadows... Shadows
 * must be subtle and must not replace visible boundaries." Every
 * level therefore carries a border, and shadow values stay light
 * enough to read as a hint, not a replacement for that border.
 */
export interface ElevationStep {
  /** Whether this level renders a 1px border using color.border. */
  border: boolean;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffsetY: number;
}

export const elevation = {
  /** Level 0: flat page surface. */
  level0: {
    border: false,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  /** Level 1: bordered case card. */
  level1: {
    border: true,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffsetY: 1,
  },
  /** Level 2: sticky action region and bottom sheet. */
  level2: {
    border: true,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffsetY: 2,
  },
  /** Level 3: dialog or temporary overlay. */
  level3: {
    border: true,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffsetY: 4,
  },
} as const satisfies Record<string, ElevationStep>;

export type ElevationToken = keyof typeof elevation;
