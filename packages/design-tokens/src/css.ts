/**
 * Renders color tokens as CSS custom-property declarations, so web
 * consumers get the tokens without any raw hex value ever being
 * typed outside this package (AGENTS.md project standard 11 /
 * scripts/check-no-hex-emoji.sh, which excludes only this package).
 */
import type { ColorTheme, StatusColors } from "./colors";

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function themeToCssVariables(
  theme: ColorTheme & StatusColors,
  prefix = "rescue",
): string {
  return Object.entries(theme)
    .map(([key, value]) => `  --${prefix}-${toKebabCase(key)}: ${value};`)
    .join("\n");
}

/**
 * Same values as themeToCssVariables, as a plain object rather than a
 * CSS string - what NativeWind's vars() runtime helper expects for
 * native (non-web) CSS custom properties.
 */
export function themeToVarsObject(
  theme: ColorTheme & StatusColors,
  prefix = "rescue",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([key, value]) => [
      `--${prefix}-${toKebabCase(key)}`,
      value,
    ]),
  );
}
