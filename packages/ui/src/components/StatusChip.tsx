import { cloneElement, isValidElement, type ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../primitives/Text";
import {
  AlertTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  type LucideIcon,
} from "@rescue-alert/icons";

/** design/DESIGN.md section 5.2 status tokens. */
export type StatusChipTone =
  "critical" | "urgent" | "support" | "success" | "warning" | "neutral";

export interface StatusChipProps {
  tone: StatusChipTone;
  label: string;
  /** Overrides the tone's default icon. */
  icon?: ReactElement;
  className?: string;
}

const TONE_CLASS: Record<StatusChipTone, { container: string; text: string }> =
  {
    critical: { container: "bg-critical-container", text: "text-critical" },
    urgent: { container: "bg-urgent-container", text: "text-urgent" },
    support: { container: "bg-support-container", text: "text-support" },
    success: { container: "bg-success-container", text: "text-success" },
    warning: { container: "bg-warning-container", text: "text-warning" },
    neutral: { container: "bg-neutral-container", text: "text-neutral" },
  };

// Components, not pre-built elements: the tone-matched text color
// class has to be applied to the icon directly (Lucide's className
// styles its own SVG stroke via NativeWind - it does not inherit
// color from an ancestor View's className the way RN Text does).
const TONE_DEFAULT_ICON: Record<StatusChipTone, LucideIcon> = {
  critical: AlertTriangleIcon,
  urgent: AlertTriangleIcon,
  support: ClockIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  neutral: ClockIcon,
};

/**
 * design/DESIGN.md section 11.4 - the signature element (AGENTS.md
 * Design System). Icon + text + semantic background together, never
 * color alone, rendered identically everywhere a case's status or
 * urgency appears (case card, case header, map marker, push
 * notification). Not for long sentences or primary actions.
 */
export function StatusChip({ tone, label, icon, className }: StatusChipProps) {
  const style = TONE_CLASS[tone];
  const DefaultIcon = TONE_DEFAULT_ICON[tone];

  const resolvedIcon =
    icon && isValidElement(icon) ? (
      cloneElement(icon as ReactElement<{ className?: string }>, {
        className: [
          style.text,
          (icon.props as { className?: string }).className,
        ]
          .filter(Boolean)
          .join(" "),
      })
    ) : (
      <DefaultIcon size={16} className={style.text} />
    );

  return (
    <View
      className={[
        "flex-row items-center gap-1 self-start rounded-small px-2 py-1",
        style.container,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {resolvedIcon}
      <Text variant="labelMedium" className={style.text}>
        {label}
      </Text>
    </View>
  );
}
