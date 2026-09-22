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
  className?: string;
}

const STATE_CONTENT: Record<
  DraftState,
  { label: string; icon: LucideIcon; className: string }
> = {
  pending: {
    label: "Saved on this device",
    icon: ClockIcon,
    className: "text-text-muted",
  },
  syncing: { label: "Syncing", icon: ClockIcon, className: "text-text-muted" },
  synced: { label: "Synced", icon: CheckCircleIcon, className: "text-success" },
  failed: {
    label: "Could not send. Saved on this device.",
    icon: AlertTriangleIcon,
    className: "text-critical",
  },
};

/**
 * design/DESIGN.md section 18.2 primitives list, OFF-006: the app
 * must not claim success before server confirmation. This is the
 * single place that distinction is rendered, so every screen shows it
 * the same way. Wording matches DESIGN.md section 17.2's preferred
 * phrasing exactly ("Could not send. Your report is saved on this
 * device." - abbreviated here to fit a compact indicator; full text
 * belongs in the surrounding error message, not this badge).
 */
export function DraftIndicator({ state, className }: DraftIndicatorProps) {
  const content = STATE_CONTENT[state];
  const Icon = content.icon;

  return (
    <View
      className={["flex-row items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
      accessibilityLiveRegion="polite"
    >
      <Icon size={16} className={content.className} />
      <Text variant="caption" className={content.className}>
        {content.label}
      </Text>
    </View>
  );
}
