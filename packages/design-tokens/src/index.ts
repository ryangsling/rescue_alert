export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./radius";
export * from "./elevation";
export * from "./motion";
export * from "./breakpoints";
export * from "./contrast";
export * from "./css";

import { colors } from "./colors";

/** A theme name is the only thing feature code should need to pick a palette. */
export type ThemeName = "light" | "dark";

export function getTheme(name: ThemeName) {
  return colors[name];
}
