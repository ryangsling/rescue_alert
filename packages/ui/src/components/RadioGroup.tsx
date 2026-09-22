import { Pressable, View } from "react-native";
import { Text } from "../primitives/Text";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

export interface RadioGroupProps<T extends string> {
  label: string;
  options: readonly RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  errorText?: string;
  className?: string;
}

/** design/DESIGN.md section 11.3. accessibilityRole="radiogroup" on the container, "radio" per option. */
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  errorText,
  className,
}: RadioGroupProps<T>) {
  return (
    // accessible is required for the react-native-css-interop/RNTL
    // test renderer to expose this as a queryable "radiogroup" role
    // at all. Real iOS/Android accessibility services can treat
    // `accessible` on a container as collapsing its children into one
    // focus stop - this has not been verified with a real screen
    // reader (TalkBack/VoiceOver), which design/DESIGN.md section 15
    // calls for as manual testing this environment cannot perform.
    // If a real device shows radio options are no longer individually
    // reachable, drop `accessible` here.
    <View
      className={["gap-2", className].filter(Boolean).join(" ")}
      accessible
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      <Text variant="labelLarge">{label}</Text>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            className={[
              "min-h-11 flex-row items-center gap-3",
              disabled ? "opacity-50" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, disabled }}
            onPress={() => onChange(option.value)}
          >
            <View
              className={[
                "h-6 w-6 items-center justify-center rounded-full border-2",
                selected ? "border-primary" : "border-border-strong",
              ].join(" ")}
            >
              {selected ? (
                <View className="h-3 w-3 rounded-full bg-primary" />
              ) : null}
            </View>
            <Text className="flex-1">{option.label}</Text>
          </Pressable>
        );
      })}
      {errorText ? (
        <Text variant="caption" className="text-critical">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
