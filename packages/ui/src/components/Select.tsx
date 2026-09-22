import { useState } from "react";
import { Pressable } from "react-native";
import { FormField } from "./FormField";
import { Menu } from "./Menu";
import { Text } from "../primitives/Text";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  helpText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** design/DESIGN.md section 11.3 "Select". Built on Menu - see its note on anchor positioning. */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  helpText,
  errorText,
  required = false,
  disabled = false,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <FormField
      label={label}
      helpText={helpText}
      errorText={errorText}
      required={required}
    >
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selectedLabel ?? placeholder }}
        accessibilityState={{ disabled }}
        className={[
          "min-h-12 flex-row items-center justify-between rounded-medium border bg-surface px-4",
          errorText ? "border-critical" : "border-border",
          disabled ? "opacity-50" : undefined,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onPress={() => setOpen(true)}
      >
        <Text tone={selectedLabel ? "default" : "muted"}>
          {selectedLabel ?? placeholder}
        </Text>
      </Pressable>
      <Menu
        visible={open}
        onRequestClose={() => setOpen(false)}
        items={options.map((option) => ({
          label: option.label,
          onSelect: () => onChange(option.value),
        }))}
      />
    </FormField>
  );
}
