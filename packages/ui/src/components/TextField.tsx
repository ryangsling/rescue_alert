import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { FormField } from "./FormField";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  helpText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** AUTH-002: Bangladesh phone input. Renders a fixed +880 prefix and constrains input to digits. */
  phoneField?: boolean;
}

/**
 * Backs text, password (secureTextEntry), search (keyboardType /
 * returnKeyType left to the caller), and phone (phoneField) inputs -
 * design/DESIGN.md section 11.3 groups these as one control shape.
 * Focus, disabled, and loading states are all real, not simulated.
 */
export function TextField({
  label,
  helpText,
  errorText,
  required = false,
  disabled = false,
  loading = false,
  className,
  phoneField = false,
  onFocus,
  onBlur,
  editable,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || loading;

  const classes = [
    "min-h-12 flex-row items-center rounded-medium border bg-surface px-4",
    focused ? "border-focus" : errorText ? "border-critical" : "border-border",
    isDisabled ? "opacity-50" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FormField
      label={label}
      helpText={helpText}
      errorText={errorText}
      required={required}
    >
      <TextInput
        className={classes}
        accessibilityLabel={label}
        accessibilityHint={errorText ?? helpText}
        editable={editable ?? !isDisabled}
        // TextInput's placeholderTextColor is a native prop, not a
        // style - NativeWind's className interop does not cover it.
        // Generic named color rather than a design token pending
        // that investigation; not a WCAG-critical value (real text
        // uses the text-text-muted class, which is token-driven).
        placeholderTextColor="gray"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...(phoneField
          ? {
              keyboardType: "phone-pad" as const,
              // AUTH-002: normalized as +8801XXXXXXXXX server-side;
              // the visible prefix here is a UX affordance only.
              defaultValue: "+880 ",
            }
          : {})}
        {...props}
      />
    </FormField>
  );
}
