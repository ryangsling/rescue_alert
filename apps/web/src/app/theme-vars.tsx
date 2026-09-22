import {
  darkColors,
  darkStatusColors,
  lightColors,
  lightStatusColors,
  themeToCssVariables,
} from "@rescue-alert/design-tokens";

/**
 * Injects the Rescue UI palette as CSS custom properties. This is the
 * only place `packages/design-tokens`' color values reach the web
 * app - everything downstream reads `var(--rescue-*)`, never a hex
 * literal (see globals.css and AGENTS.md project standard 11).
 *
 * Dark mode follows the system preference via `prefers-color-scheme`,
 * matching design/DESIGN.md's light/dark themes (section 5.3) rather
 * than a manual toggle, which the MVP does not require.
 */
export function ThemeVars() {
  const light = themeToCssVariables({ ...lightColors, ...lightStatusColors });
  const dark = themeToCssVariables({ ...darkColors, ...darkStatusColors });

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root {
${light}
}
@media (prefers-color-scheme: dark) {
  :root {
${dark}
  }
}
`,
      }}
    />
  );
}
