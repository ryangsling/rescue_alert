import { Pressable, View } from "react-native";
import { Text } from "../primitives/Text";
import { CheckCircleIcon } from "@rescue-alert/icons";
import type { Database } from "@rescue-alert/types";

type AssistanceType = Database["public"]["Enums"]["assistance_type"];

const ASSISTANCE_LABELS: Record<AssistanceType, string> = {
  on_site_rescue: "On-site rescue",
  transport: "Transport",
  veterinary_treatment: "Veterinary treatment",
  temporary_foster: "Temporary foster",
  shelter_coordination: "Shelter coordination",
  case_coordination: "Case coordination",
  financial_support: "Financial support",
};

export interface NeedsSelectorProps {
  /** Every assistance type this case could need, with whether it is still unfulfilled. */
  needs: readonly { type: AssistanceType; isFulfilled: boolean }[];
  /** Toggle selection for the *creator/coordinator editing which needs apply* - omit for a read-only display. */
  onToggle?: (type: AssistanceType) => void;
  className?: string;
}

/**
 * design/DESIGN.md section 18.2 primitives list. RESP-006: the case
 * must clearly show unfilled needs. Fulfilled needs show a check and
 * muted styling rather than disappearing, so the full picture of what
 * was needed stays visible.
 */
export function NeedsSelector({
  needs,
  onToggle,
  className,
}: NeedsSelectorProps) {
  return (
    <View
      className={["flex-row flex-wrap gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {needs.map(({ type, isFulfilled }) => {
        const label = ASSISTANCE_LABELS[type];
        const content = (
          <View
            className={[
              "min-h-11 flex-row items-center gap-1 rounded-medium border px-3 py-2",
              isFulfilled
                ? "border-border bg-surface-subtle"
                : "border-support bg-support-container",
            ].join(" ")}
          >
            {isFulfilled ? (
              <CheckCircleIcon size={16} className="text-text-muted" />
            ) : null}
            <Text
              variant="labelMedium"
              className={
                isFulfilled ? "text-text-muted line-through" : "text-support"
              }
            >
              {label}
            </Text>
          </View>
        );

        if (!onToggle) {
          return <View key={type}>{content}</View>;
        }

        return (
          <Pressable
            key={type}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked: isFulfilled }}
            onPress={() => onToggle(type)}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
