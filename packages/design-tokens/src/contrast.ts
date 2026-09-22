/**
 * WCAG 2.x relative luminance and contrast ratio, for validating
 * Rescue UI color pairs (design/DESIGN.md section 15: 4.5:1 for
 * normal text, 3:1 for large text and meaningful boundaries).
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean;
  const num = Number.parseInt(value, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Contrast ratio between two opaque colors, per WCAG 2.x. Order does not matter. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_NORMAL_TEXT_MIN = 4.5;
export const WCAG_LARGE_TEXT_OR_BOUNDARY_MIN = 3;
