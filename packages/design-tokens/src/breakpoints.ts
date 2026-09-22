/**
 * Rescue UI responsive breakpoints, in pixels. design/DESIGN.md
 * section 7.3. Components should respond to available width rather
 * than design by breakpoint alone (DESIGN.md section 7.3 note).
 */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointToken = keyof typeof breakpoints;
