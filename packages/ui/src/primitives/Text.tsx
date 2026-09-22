import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { typeScale, type TypeScaleToken } from "@rescue-alert/design-tokens";

export interface TextProps extends RNTextProps {
  /** design/DESIGN.md section 6.2 type scale step. Defaults to body copy. */
  variant?: TypeScaleToken;
  /** Semantic text color role. Defaults to the standard text color via className. */
  tone?: "default" | "muted";
  className?: string;
}

/**
 * The only place a screen should reach for a raw RN <Text>. Applies
 * the DESIGN.md type scale directly as numeric style (fontSize,
 * lineHeight, fontWeight are all numbers RN's StyleSheet expects),
 * while color and spacing still flow through NativeWind className so
 * they respond to the light/dark class on the root view.
 */
export function Text({
  variant = "bodyLarge",
  tone = "default",
  className,
  style,
  ...props
}: TextProps) {
  const scale = typeScale[variant];
  const toneClassName = tone === "muted" ? "text-text-muted" : "text-text";

  return (
    <RNText
      className={[toneClassName, className].filter(Boolean).join(" ")}
      style={[
        {
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          fontWeight: scale.fontWeight,
        },
        style,
      ]}
      {...props}
    />
  );
}
