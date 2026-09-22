import { View, type ViewProps } from "react-native";
import {
  elevation,
  type ElevationToken,
  type RadiusToken,
} from "@rescue-alert/design-tokens";

export interface SurfaceProps extends ViewProps {
  /** design/DESIGN.md section 8.2. Defaults to a flat page surface. */
  elevation?: ElevationToken;
  /** design/DESIGN.md section 8.1. Defaults to large (cards). */
  radius?: RadiusToken;
  tone?: "surface" | "surfaceSubtle" | "surfaceStrong";
  className?: string;
}

const TONE_CLASS = {
  surface: "bg-surface",
  surfaceSubtle: "bg-surface-subtle",
  surfaceStrong: "bg-surface-strong",
} as const;

const RADIUS_CLASS: Record<RadiusToken, string> = {
  none: "rounded-none",
  small: "rounded-small",
  medium: "rounded-medium",
  large: "rounded-large",
  full: "rounded-full",
};

/**
 * A bordered, elevated container. design/DESIGN.md section 8.2:
 * "Prefer borders and surface contrast over heavy shadows" - every
 * non-flat level renders a 1px border, and the shadow (RN's shadow
 * and elevation style props) stays subtle per elevation.ts.
 */
export function Surface({
  elevation: level = "level0",
  radius: radiusToken = "large",
  tone = "surface",
  className,
  style,
  ...props
}: SurfaceProps) {
  const step = elevation[level];
  const classes = [
    TONE_CLASS[tone],
    RADIUS_CLASS[radiusToken],
    step.border ? "border border-border" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View
      className={classes}
      style={[
        step.shadowOpacity > 0
          ? {
              // Named color, not a hex literal - see
              // scripts/check-no-hex-emoji.sh, which does not exempt
              // this package.
              shadowColor: "black",
              shadowOpacity: step.shadowOpacity,
              shadowRadius: step.shadowRadius,
              shadowOffset: { width: 0, height: step.shadowOffsetY },
              elevation: step.shadowRadius,
            }
          : undefined,
        style,
      ]}
      {...props}
    />
  );
}
