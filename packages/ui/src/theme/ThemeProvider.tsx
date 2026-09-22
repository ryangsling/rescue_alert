import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { vars, useColorScheme } from "nativewind";
import {
  darkColors,
  darkStatusColors,
  lightColors,
  lightStatusColors,
  themeToVarsObject,
} from "@rescue-alert/design-tokens";

const lightVars = vars(
  themeToVarsObject({ ...lightColors, ...lightStatusColors }),
);
const darkVars = vars(
  themeToVarsObject({ ...darkColors, ...darkStatusColors }),
);

/**
 * Sets the --rescue-* CSS custom properties every Rescue UI color
 * class resolves through (see apps/mobile/tailwind.config.ts), so
 * `bg-primary` etc. genuinely switch between design/DESIGN.md's light
 * (5.1-5.2) and dark (5.3) palettes. Follows the system color scheme
 * by default via NativeWind's own useColorScheme - DESIGN.md does not
 * call for a manual light/dark toggle in the MVP.
 *
 * Must wrap the app root, above anything that uses a Rescue UI color
 * class.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();
  return (
    <View
      style={colorScheme === "dark" ? darkVars : lightVars}
      className="flex-1"
    >
      {children}
    </View>
  );
}
