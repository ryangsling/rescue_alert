import { View } from "react-native";
import { Text } from "../primitives/Text";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@rescue-alert/icons";
import type { LucideIcon } from "@rescue-alert/icons";

export type DraftState = "pending" | "syncing" | "synced" | "failed";

export interface DraftIndicatorProps {
  state: DraftState;
  /** Resolved, already-translated text - business rules and localization stay out of this component (AGENTS.md: "components receive resolved data and emit intent"). */
  label: string;
  className?: string;
}

const STATE_TONE: Record<DraftState, { icon: LucideIcon; className: string }> =
  {
    pending: { icon: ClockIcon, className: "text-text-muted" },
    syncing: { icon: ClockIcon, className: "text-text-muted" },
    synced: { icon: CheckCircleIcon, className: "text-success" },
    failed: { icon: AlertTriangleIcon, className: "text-critical" },
  };

/**
 * design/DESIGN.md section 18.2 primitives list, OFF-006: the app
 * must not claim success before server confirmation. This is the
 * single place that distinction is rendered, so every screen shows it
 * the same way. The icon and tone are derived from `state`; the
 * caller supplies the already-translated `label` (DESIGN.md section
 * 17.2's preferred phrasing, e.g. "Could not send. Your report is
 * saved on this device.").
 */
export function DraftIndicator({
  state,
  label,
  className,
}: DraftIndicatorProps) {
  const tone = STATE_TONE[state];
  const Icon = tone.icon;

  return (
    <View
      className={["flex-row items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
      accessibilityLiveRegion="polite"
    >
      <Icon size={16} className={tone.className} />
      <Text variant="caption" className={tone.className}>
        {label}
      </Text>
    </View>
  );
}
