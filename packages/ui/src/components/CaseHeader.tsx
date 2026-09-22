import { View } from "react-native";
import { Text } from "../primitives/Text";
import { StatusChip, type StatusChipTone } from "./StatusChip";
import { IconButton } from "./IconButton";
import type { Database } from "@rescue-alert/types";
import { ShareIcon, ReportIcon } from "@rescue-alert/icons";

export interface CaseHeaderProps {
  urgency: Database["public"]["Enums"]["urgency_level"];
  title: string;
  areaLabel: string;
  distanceLabel?: string;
  lastUpdateLabel: string;
  statusLabel: string;
  statusTone: StatusChipTone;
  onShare?: () => void;
  onReport?: () => void;
  className?: string;
}

const URGENCY_TONE: Record<
  Database["public"]["Enums"]["urgency_level"],
  StatusChipTone
> = {
  critical: "critical",
  urgent: "urgent",
  support_needed: "support",
  adoption_community: "neutral",
};

const URGENCY_LABEL: Record<
  Database["public"]["Enums"]["urgency_level"],
  string
> = {
  critical: "Critical",
  urgent: "Urgent",
  support_needed: "Support needed",
  adoption_community: "Adoption/community",
};

/**
 * design/DESIGN.md section 11.6. The main rescue action lives outside
 * this header (a sticky action region per section 8.2 elevation
 * level 2) so it never gets obscured by the header content itself.
 */
export function CaseHeader({
  urgency,
  title,
  areaLabel,
  distanceLabel,
  lastUpdateLabel,
  statusLabel,
  statusTone,
  onShare,
  onReport,
  className,
}: CaseHeaderProps) {
  return (
    <View className={["gap-2", className].filter(Boolean).join(" ")}>
      <View className="flex-row items-start justify-between gap-2">
        <StatusChip
          tone={URGENCY_TONE[urgency]}
          label={URGENCY_LABEL[urgency]}
        />
        <View className="flex-row gap-1">
          {onShare ? (
            <IconButton
              icon={<ShareIcon size={20} className="text-text-muted" />}
              accessibilityLabel="Share"
              onPress={onShare}
            />
          ) : null}
          {onReport ? (
            <IconButton
              icon={<ReportIcon size={20} className="text-text-muted" />}
              accessibilityLabel="Report this case"
              onPress={onReport}
            />
          ) : null}
        </View>
      </View>
      <Text variant="heading2">{title}</Text>
      <Text variant="bodyMedium" tone="muted">
        {[areaLabel, distanceLabel].filter(Boolean).join(" - ")}
      </Text>
      <Text variant="caption" tone="muted">
        {lastUpdateLabel}
      </Text>
      <StatusChip tone={statusTone} label={statusLabel} />
    </View>
  );
}
