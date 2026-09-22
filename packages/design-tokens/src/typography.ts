/**
 * Rescue UI typography tokens. design/DESIGN.md section 6.
 */

export const fontFamilies = {
  latin: "Inter",
  bengali: "Noto Sans Bengali",
  fallback: "system-ui",
  mono: "ui-monospace",
} as const;

export interface TypeScaleStep {
  fontSize: number;
  lineHeight: number;
  fontWeight: 400 | 600 | 700;
}

/** design/DESIGN.md section 6.2. */
export const typeScale = {
  displayLarge: { fontSize: 40, lineHeight: 48, fontWeight: 700 },
  displaySmall: { fontSize: 32, lineHeight: 40, fontWeight: 700 },
  heading1: { fontSize: 28, lineHeight: 36, fontWeight: 700 },
  heading2: { fontSize: 24, lineHeight: 32, fontWeight: 700 },
  heading3: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  titleLarge: { fontSize: 18, lineHeight: 26, fontWeight: 600 },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: 600 },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
  bodyMedium: { fontSize: 14, lineHeight: 21, fontWeight: 400 },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  labelMedium: { fontSize: 12, lineHeight: 18, fontWeight: 600 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: 400 },
} as const satisfies Record<string, TypeScaleStep>;

export type TypeScaleToken = keyof typeof typeScale;
