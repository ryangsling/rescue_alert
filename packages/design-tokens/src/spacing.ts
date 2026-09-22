/**
 * Rescue UI spacing scale, in pixels. design/DESIGN.md section 7.1.
 * Keys match the DESIGN.md step numbers so this object plugs directly
 * into a Tailwind/NativeWind theme.extend.spacing table.
 */
export const spacing = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
} as const;

export type SpacingToken = keyof typeof spacing;
