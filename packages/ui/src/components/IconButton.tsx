import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, type PressableProps } from "react-native";

export interface IconButtonProps extends PressableProps {
  icon: ReactElement;
  /** Required, not optional - an icon-only control has no visible label. design/DESIGN.md section 9. */
  accessibilityLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * design/DESIGN.md section 11.2 "Icon" variant. 44x44 minimum touch
 * target (section 15) even though the icon glyph itself is smaller -
 * padding makes up the difference.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  disabled = false,
  className,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const [pressed, setPressed] = useState(false);
  const classes = [
    "h-11 w-11 items-center justify-center rounded-full",
    disabled ? "opacity-50" : pressed ? "bg-surface-strong" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable
      className={classes}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...props}
    >
      {icon}
    </Pressable>
  );
}
