import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { Text } from "../primitives/Text";

export interface FormFieldProps extends PropsWithChildren {
  label: string;
  /** Rendered below the control when there is no error. */
  helpText?: string;
  /** Rendered below the control instead of helpText, in the critical tone. */
  errorText?: string;
  required?: boolean;
  className?: string;
}

/**
 * design/DESIGN.md section 11.3: "Every field requires label, help
 * text where needed, error text, focus state, disabled state, and
 * loading state." This wrapper renders the label/help/error text;
 * focus/disabled/loading are the responsibility of the control it
 * wraps.
 *
 * React Native has no DOM-style id/aria-labelledby linkage that
 * works reliably across iOS and Android, so this is a visual wrapper
 * only - each control (TextField, etc.) additionally sets its own
 * accessibilityLabel from the same `label` string it was given,
 * duplicating the text rather than referencing it, which is the
 * standard RN accessibility pattern.
 */
export function FormField({
  label,
  helpText,
  errorText,
  required = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <View className={["gap-1", className].filter(Boolean).join(" ")}>
      <Text variant="labelLarge">
        {label}
        {required ? " *" : ""}
      </Text>
      {children}
      {errorText ? (
        <Text variant="caption" className="text-critical">
          {errorText}
        </Text>
      ) : helpText ? (
        <Text variant="caption" tone="muted">
          {helpText}
        </Text>
      ) : null}
    </View>
  );
}
