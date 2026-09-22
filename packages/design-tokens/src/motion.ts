/**
 * Rescue UI motion tokens, in milliseconds. design/DESIGN.md
 * section 10.1. Motion confirms state changes, it does not decorate
 * emergencies - no continuously pulsing markers, no confetti on
 * closure (DESIGN.md section 10.2).
 */
export const motion = {
  fast: 120,
  standard: 200,
  slow: 320,
} as const;

export type MotionToken = keyof typeof motion;
