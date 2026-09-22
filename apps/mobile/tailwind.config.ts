import {
  breakpoints,
  lightColors,
  lightStatusColors,
  radius,
  spacing,
} from "@rescue-alert/design-tokens";
import type { Config } from "tailwindcss";

// Every Tailwind color class resolves to a var(--rescue-*) CSS custom
// property, not a fixed value - packages/ui's ThemeProvider sets the
// actual light/dark values via NativeWind's vars() at runtime (see
// ThemeProvider.tsx), so `bg-primary` genuinely switches with the
// active theme instead of needing a `dark:` prefix on every class.
// Keys are still enumerated here (light values as fallback text) only
// so Tailwind knows which utility classes to generate; the values
// below are never what actually renders.
function toCssVarRefs(theme: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(theme).map((key) => {
      const kebab = key.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      );
      return [kebab, `var(--rescue-${kebab})`];
    }),
  );
}

// Design tokens store plain numbers (React Native's StyleSheet wants
// numbers, not strings) - Tailwind's theme scale wants px strings.
// Converted only at this boundary, never in the token source.
function toPx(scale: Record<string, number>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, `${value}px`]),
  );
}

export default {
  // Must cover every package whose components use Tailwind classes,
  // not just this app's own source - Tailwind's content scanner does
  // not follow imports, it only regex-scans the literal files listed
  // here. Proven directly: before this fix, only classes typed inline
  // in apps/mobile/src (flex-1, p-8) survived into the compiled CSS;
  // every class used inside packages/ui components (text-text,
  // bg-primary, items-center, ...) was silently dropped.
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: toCssVarRefs({ ...lightColors, ...lightStatusColors }),
      spacing: toPx(spacing),
      borderRadius: toPx(radius),
      screens: {
        sm: `${breakpoints.sm}px`,
        md: `${breakpoints.md}px`,
        lg: `${breakpoints.lg}px`,
        xl: `${breakpoints.xl}px`,
      },
    },
  },
  plugins: [],
} satisfies Config;
