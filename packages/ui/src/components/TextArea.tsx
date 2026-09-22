import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { typeScale } from "@rescue-alert/design-tokens";
import { FormField } from "./FormField";

export interface TextAreaProps extends Omit<
  TextInputProps,
  "style" | "multiline"
> {
  label: string;
  helpText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Rows determine minHeight, since RN has no native rows attribute. */
  rows?: number;
}

/** design/DESIGN.md section 11.3 "Text area". */
export function TextArea({
  label,
  helpText,
  errorText,
  required = false,
  disabled = false,
  className,
  rows = 4,
  onFocus,
  onBlur,
  editable,
  ...props
}: TextAreaProps) {
  const [focused, setFocused] = useState(false);

  const classes = [
    "rounded-medium border bg-surface p-4",
    focused ? "border-focus" : errorText ? "border-critical" : "border-border",
    disabled ? "opacity-50" : undefined,
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
        multiline
        textAlignVertical="top"
        style={{ minHeight: rows * typeScale.bodyMedium.lineHeight }}
        className={classes}
        accessibilityLabel={label}
        accessibilityHint={errorText ?? helpText}
        editable={editable ?? !disabled}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </FormField>
  );
}
