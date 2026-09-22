import { View } from "react-native";
import { Text } from "../primitives/Text";
import { AlertTriangleIcon, VerifiedIcon } from "@rescue-alert/icons";
import type { LucideIcon } from "@rescue-alert/icons";

export type SafetyCalloutTone =
  "critical" | "warning" | "information" | "positive";

export interface SafetyCalloutProps {
  tone: SafetyCalloutTone;
  heading: string;
  /** design/DESIGN.md section 11.9: two or three concise instructions. */
  instructions: readonly string[];
  /** Optional link label, e.g. "Read full safety guidance". Rendering the actual link is left to the caller (navigation is app-specific). */
  linkLabel?: string;
  onLinkPress?: () => void;
  className?: string;
}

const TONE_CLASS: Record<
  SafetyCalloutTone,
  { container: string; text: string }
> = {
  critical: { container: "bg-critical-container", text: "text-critical" },
  warning: { container: "bg-warning-container", text: "text-warning" },
  information: { container: "bg-support-container", text: "text-support" },
  positive: { container: "bg-success-container", text: "text-success" },
};

const TONE_ICON: Record<SafetyCalloutTone, LucideIcon> = {
  critical: AlertTriangleIcon,
  warning: AlertTriangleIcon,
  information: AlertTriangleIcon,
  positive: VerifiedIcon,
};

/**
 * design/DESIGN.md section 11.9 and section 3.4 "Safety is visible" -
 * must not be hidden in settings; shown contextually where a case
 * involves aggression, suspected rabies, traffic, abuse, electricity,
 * height, water, or other hazards (PRD section 12.1).
 */
export function SafetyCallout({
  tone,
  heading,
  instructions,
  linkLabel,
  onLinkPress,
  className,
}: SafetyCalloutProps) {
  const style = TONE_CLASS[tone];
  const Icon = TONE_ICON[tone];

  return (
    <View
      className={["gap-2 rounded-medium p-4", style.container, className]
        .filter(Boolean)
        .join(" ")}
      accessibilityRole="alert"
    >
      <View className="flex-row items-center gap-2">
        <Icon size={20} className={style.text} />
        <Text variant="titleMedium" className={style.text}>
          {heading}
        </Text>
      </View>
      {instructions.map((instruction) => (
        <Text key={instruction} variant="bodyMedium" className={style.text}>
          {instruction}
        </Text>
      ))}
      {linkLabel ? (
        <Text
          variant="labelLarge"
          className={[style.text, "underline"].join(" ")}
          accessibilityRole="link"
          onPress={onLinkPress}
        >
          {linkLabel}
        </Text>
      ) : null}
    </View>
  );
}
