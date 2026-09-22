import { Switch as RNSwitch, View } from "react-native";
import { Text } from "../primitives/Text";

export interface SwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  helpText?: string;
  className?: string;
}

/** design/DESIGN.md section 11.3. Used for e.g. PROF-003 availability toggles. */
export function Switch({
  label,
  value,
  onChange,
  disabled = false,
  helpText,
  className,
}: SwitchProps) {
  return (
    <View
      className={[
        "min-h-11 flex-row items-center justify-between gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="flex-1 gap-1">
        <Text>{label}</Text>
        {helpText ? (
          <Text variant="caption" tone="muted">
            {helpText}
          </Text>
        ) : null}
      </View>
      <RNSwitch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      />
    </View>
  );
}
