import { Pressable, View } from "react-native";
import { Text } from "../primitives/Text";
import type { StatusChipTone } from "./StatusChip";

/** PRD section 8.2, in urgency order. */
export type UrgencyLevel =
  "critical" | "urgent" | "support_needed" | "adoption_community";

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critical: "Critical",
  urgent: "Urgent",
  support_needed: "Support needed",
  adoption_community: "Adoption/community",
};

// adoption_community has no PRD/DESIGN.md-specified semantic color -
// it is the no-emergency tier ("Feed and search discovery; no
// emergency notification" per PRD 8.2), so it uses the neutral tone.
const URGENCY_TONE: Record<UrgencyLevel, StatusChipTone> = {
  critical: "critical",
  urgent: "urgent",
  support_needed: "support",
  adoption_community: "neutral",
};

const SELECTED_CLASS: Record<StatusChipTone, string> = {
  critical: "bg-critical",
  urgent: "bg-urgent",
  support: "bg-support",
  success: "bg-success",
  warning: "bg-warning",
  neutral: "bg-neutral",
};

export interface UrgencySelectorProps {
  value: UrgencyLevel | null;
  onChange: (value: UrgencyLevel) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * design/DESIGN.md section 11.3 "Segmented urgency control". PRD
 * section 8.2 states urgency is community-reported, not a
 * professional assessment - callers should pair this with that
 * disclaimer text, which is a content concern, not this component's.
 */
export function UrgencySelector({
  value,
  onChange,
  disabled = false,
  className,
}: UrgencySelectorProps) {
  return (
    <View
      className={["flex-row flex-wrap gap-2", className]
        .filter(Boolean)
        .join(" ")}
      accessibilityRole="radiogroup"
      accessibilityLabel="Urgency"
    >
      {(Object.keys(URGENCY_LABELS) as UrgencyLevel[]).map((level) => {
        const selected = value === level;
        const tone = URGENCY_TONE[level];
        return (
          <Pressable
            key={level}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={URGENCY_LABELS[level]}
            accessibilityState={{ checked: selected, disabled }}
            className={[
              "min-h-11 items-center justify-center rounded-medium border px-3 py-2",
              selected
                ? [SELECTED_CLASS[tone], "border-transparent"].join(" ")
                : "border-border bg-surface",
              disabled ? "opacity-50" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onPress={() => onChange(level)}
          >
            <Text
              variant="labelMedium"
              className={selected ? "text-on-primary" : "text-text"}
            >
              {URGENCY_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
