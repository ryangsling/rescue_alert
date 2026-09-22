import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";
import { Text } from "../primitives/Text";

/** design/DESIGN.md section 11.2. "floating" is the report action FAB. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "outline"
  | "text"
  | "destructive"
  | "floating";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  children: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<
  ButtonVariant,
  { container: string; text: string }
> = {
  primary: { container: "bg-primary", text: "text-on-primary" },
  secondary: { container: "bg-secondary", text: "text-on-primary" },
  tonal: {
    container: "bg-primary-container",
    text: "text-on-primary-container",
  },
  outline: {
    container: "border border-border-strong bg-transparent",
    text: "text-text",
  },
  text: { container: "bg-transparent", text: "text-primary" },
  destructive: { container: "bg-critical", text: "text-on-primary" },
  floating: { container: "bg-primary rounded-full", text: "text-on-primary" },
};

/**
 * design/DESIGN.md section 11.2: 48px minimum height, one dominant
 * primary action per region (a UI convention, not enforced here),
 * loading state keeps the button's width (min-width matches an
 * estimate of the label so the spinner never causes reflow - a fixed
 * pixel width isn't knowable ahead of render, so this reserves space
 * by keeping the label mounted but invisible alongside the spinner).
 */
export function Button({
  variant = "primary",
  children,
  loading = false,
  disabled = false,
  className,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const style = VARIANT_CLASS[variant];
  const isDisabled = disabled || loading;
  const isIconOnlyShape = variant === "floating";

  const classes = [
    "min-h-12 flex-row items-center justify-center gap-2 rounded-medium px-6",
    style.container,
    isDisabled ? "opacity-50" : pressed ? "opacity-80" : undefined,
    isIconOnlyShape ? "aspect-square px-0" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable
      className={classes}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
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
      <Text
        variant="labelLarge"
        className={[style.text, loading ? "opacity-0" : undefined]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </Text>
      {loading ? (
        <ActivityIndicator
          className="absolute"
          size="small"
          accessibilityLabel="Loading"
        />
      ) : null}
    </Pressable>
  );
}
