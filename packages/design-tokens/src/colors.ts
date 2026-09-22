/**
 * Rescue UI color tokens. design/DESIGN.md sections 5.1-5.3.
 *
 * Feature code must reference these semantic tokens, never a raw hex
 * value (design/DESIGN.md section 18.3, AGENTS.md project standard 11
 * / CI check in scripts/check-no-hex-emoji.sh).
 *
 * Dark-theme status colors are not enumerated in DESIGN.md - only the
 * neutral/primary dark tokens are. DESIGN.md section 5.3 requires
 * "separate dark-theme containers rather than mechanically inverted
 * values", so the dark status pairs below are derived following the
 * same foreground-on-container relationship as the specified primary
 * token (light, desaturated foreground on a dark, saturated
 * container), not a mechanical light/dark swap.
 */

export interface ColorTheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  tertiary: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceStrong: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  focus: string;
  scrim: string;
}

export interface StatusColors {
  critical: string;
  criticalContainer: string;
  urgent: string;
  urgentContainer: string;
  support: string;
  supportContainer: string;
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  neutral: string;
  neutralContainer: string;
}

export const lightColors: ColorTheme = {
  primary: "#0B6B58",
  onPrimary: "#FFFFFF",
  primaryContainer: "#D5F3E9",
  onPrimaryContainer: "#073B31",
  secondary: "#3E6259",
  secondaryContainer: "#DDECE7",
  tertiary: "#315D7A",
  background: "#FCFDFC",
  surface: "#FFFFFF",
  surfaceSubtle: "#F3F6F4",
  surfaceStrong: "#E8EEEB",
  text: "#17201D",
  textMuted: "#58635F",
  border: "#CAD4D0",
  borderStrong: "#8E9B96",
  focus: "#006CFF",
  scrim: "rgba(0, 0, 0, 0.45)",
};

export const lightStatusColors: StatusColors = {
  critical: "#B3261E",
  criticalContainer: "#FFDAD6",
  urgent: "#9B4A00",
  urgentContainer: "#FFE0C2",
  support: "#1D5B9F",
  supportContainer: "#D6E4FF",
  success: "#26734D",
  successContainer: "#C8EFD8",
  warning: "#765A00",
  warningContainer: "#FBE8A6",
  neutral: "#58635F",
  neutralContainer: "#E8EEEB",
};

export const darkColors: ColorTheme = {
  primary: "#78D8BD",
  onPrimary: "#00382C",
  primaryContainer: "#005141",
  onPrimaryContainer: "#A0F2D8",
  secondary: "#A3C2B8",
  secondaryContainer: "#22463D",
  tertiary: "#9BC8EA",
  background: "#101512",
  surface: "#171D1A",
  surfaceSubtle: "#202723",
  surfaceStrong: "#2A332F",
  text: "#E6ECE8",
  textMuted: "#B7C2BD",
  border: "#3E4944",
  borderStrong: "#89948F",
  focus: "#7BB3FF",
  scrim: "rgba(0, 0, 0, 0.6)",
};

// Derived - see file comment. Follows Material 3's dark-role pattern
// (light, moderately saturated foreground on a deep, dark container).
export const darkStatusColors: StatusColors = {
  critical: "#FFB4AB",
  criticalContainer: "#5C1712",
  urgent: "#FFB77C",
  urgentContainer: "#4A3200",
  support: "#A9C7FF",
  supportContainer: "#0A3B77",
  success: "#8FDBAE",
  successContainer: "#0B4B2A",
  warning: "#E8C547",
  warningContainer: "#3D2E00",
  neutral: "#B7C2BD",
  neutralContainer: "#2A332F",
};

export const colors = {
  light: { ...lightColors, ...lightStatusColors },
  dark: { ...darkColors, ...darkStatusColors },
};
