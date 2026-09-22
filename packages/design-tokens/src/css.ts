/**
 * Renders color tokens as CSS custom-property declarations, so web
 * consumers get the tokens without any raw hex value ever being
 * typed outside this package (AGENTS.md project standard 11 /
 * scripts/check-no-hex-emoji.sh, which excludes only this package).
 */
import type { ColorTheme, StatusColors } from "./colors";

export function themeToCssVariables(
  theme: ColorTheme & StatusColors,
  prefix = "rescue",
): string {
  return Object.entries(theme)
    .map(([key, value]) => {
      const kebab = key.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      );
      return `  --${prefix}-${kebab}: ${value};`;
    })
    .join("\n");
}
