import { Pressable, View } from "react-native";
import { CheckCircleIcon } from "@rescue-alert/icons";
import { Text } from "../primitives/Text";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  errorText?: string;
  className?: string;
}

/** design/DESIGN.md section 11.3. 44x44 touch target via padding around a visually smaller box. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  errorText,
  className,
}: CheckboxProps) {
  return (
    <View className={className}>
      <Pressable
        className={[
          "min-h-11 flex-row items-center gap-3",
          disabled ? "opacity-50" : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled }}
        onPress={() => onChange(!checked)}
      >
        <View
          className={[
            "h-6 w-6 items-center justify-center rounded-small border-2",
            checked
              ? "border-primary bg-primary"
              : "border-border-strong bg-surface",
          ].join(" ")}
        >
          {checked ? <CheckCircleIcon size={16} color="white" /> : null}
        </View>
        <Text className="flex-1">{label}</Text>
      </Pressable>
      {errorText ? (
        <Text variant="caption" className="text-critical">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
