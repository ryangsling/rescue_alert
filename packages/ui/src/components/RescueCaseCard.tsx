import type { ReactNode } from "react";
import { Image, Pressable, View } from "react-native";
import { Text } from "../primitives/Text";
import { Surface } from "../primitives/Surface";
import { StatusChip, type StatusChipTone } from "./StatusChip";
import { GraphicMediaCover } from "./GraphicMediaCover";
import type { Database } from "@rescue-alert/types";

export type RescueCaseCardVariant =
  "compact" | "detailed" | "map-preview" | "activity" | "closed";

export interface RescueCaseCardProps {
  variant?: RescueCaseCardVariant;
  /** 1. Media thumbnail with graphic-content treatment. */
  thumbnailUri?: string;
  isGraphic?: boolean;
  /** 2. Urgency badge. */
  urgency: Database["public"]["Enums"]["urgency_level"];
  /** 3. Animal and incident title. */
  title: string;
  /** 4. Approximate area and distance. */
  areaLabel: string;
  distanceLabel?: string;
  /** 5. Time since last confirmed sighting or update. */
  lastUpdateLabel: string;
  /** 6. Current response state. */
  statusLabel: string;
  statusTone: StatusChipTone;
  /** 7. Remaining needs - omitted or empty once a case is closed. */
  remainingNeeds?: readonly string[];
  /** 8. Primary contextual action. */
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onPress?: () => void;
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

const THUMBNAIL_HEIGHT: Record<RescueCaseCardVariant, string> = {
  compact: "h-16 w-16",
  detailed: "h-40 w-full",
  "map-preview": "h-24 w-full",
  activity: "h-16 w-16",
  closed: "h-16 w-16",
};

/**
 * design/DESIGN.md section 11.5. One component, five layout variants,
 * rather than five near-duplicate files - the same pattern as Button
 * (one component, a variant prop) elsewhere in this package. Never
 * displays likes, popularity, or report counts (DESIGN.md section
 * 11.5 explicitly, and Part 5's success criterion).
 */
export function RescueCaseCard({
  variant = "detailed",
  thumbnailUri,
  isGraphic = false,
  urgency,
  title,
  areaLabel,
  distanceLabel,
  lastUpdateLabel,
  statusLabel,
  statusTone,
  remainingNeeds,
  primaryActionLabel,
  onPrimaryAction,
  onPress,
  className,
}: RescueCaseCardProps) {
  const isCompactLike =
    variant === "compact" || variant === "activity" || variant === "closed";

  const thumbnail: ReactNode = thumbnailUri ? (
    <View
      className={[
        THUMBNAIL_HEIGHT[variant],
        "overflow-hidden rounded-medium",
      ].join(" ")}
    >
      {isGraphic ? (
        <GraphicMediaCover>
          <Image
            source={{ uri: thumbnailUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </GraphicMediaCover>
      ) : (
        <Image
          source={{ uri: thumbnailUri }}
          className="h-full w-full"
          resizeMode="cover"
        />
      )}
    </View>
  ) : null;

  const body = (
    <View className="flex-1 gap-1">
      <StatusChip tone={URGENCY_TONE[urgency]} label={URGENCY_LABEL[urgency]} />
      <Text variant="titleMedium" numberOfLines={2}>
        {title}
      </Text>
      <Text variant="bodyMedium" tone="muted">
        {[areaLabel, distanceLabel].filter(Boolean).join(" - ")}
      </Text>
      <Text variant="caption" tone="muted">
        {lastUpdateLabel}
      </Text>
      <StatusChip tone={statusTone} label={statusLabel} />
      {remainingNeeds && remainingNeeds.length > 0 ? (
        <Text variant="caption" tone="muted">
          Still needed: {remainingNeeds.join(", ")}
        </Text>
      ) : null}
      {primaryActionLabel && onPrimaryAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryActionLabel}
          className="mt-1 self-start rounded-medium bg-primary px-4 py-2"
          onPress={onPrimaryAction}
        >
          <Text variant="labelLarge" className="text-on-primary">
            {primaryActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  const content = isCompactLike ? (
    <View className="flex-row gap-3">
      {thumbnail}
      {body}
    </View>
  ) : (
    <View className="gap-3">
      {thumbnail}
      {body}
    </View>
  );

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? title : undefined}
      onPress={onPress}
      disabled={!onPress}
    >
      <Surface
        elevation="level1"
        className={["p-4", className].filter(Boolean).join(" ")}
      >
        {content}
      </Surface>
    </Pressable>
  );
}
