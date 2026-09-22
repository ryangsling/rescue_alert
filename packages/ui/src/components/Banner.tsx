import type { ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../primitives/Text";
import { IconButton } from "./IconButton";
import { AlertTriangleIcon, DismissIcon } from "@rescue-alert/icons";

export type BannerTone = "critical" | "warning" | "support" | "neutral";

export interface BannerProps {
  tone?: BannerTone;
  message: string;
  icon?: ReactElement;
  onDismiss?: () => void;
  className?: string;
}

const TONE_CLASS: Record<BannerTone, { container: string; text: string }> = {
  critical: { container: "bg-critical-container", text: "text-critical" },
  warning: { container: "bg-warning-container", text: "text-warning" },
  support: { container: "bg-support-container", text: "text-support" },
  neutral: { container: "bg-neutral-container", text: "text-neutral" },
};

/**
 * design/DESIGN.md section 11.1: a persistent, non-modal region -
 * unlike Toast, it stays until dismissed or its condition clears, and
 * unlike Dialog it never blocks the rest of the screen. Status is
 * still never color alone: tone always pairs with an icon and text.
 */
export function Banner({
  tone = "neutral",
  message,
  icon,
  onDismiss,
  className,
}: BannerProps) {
  const style = TONE_CLASS[tone];
  return (
    <View
      className={[
        "flex-row items-center gap-3 px-4 py-3",
        style.container,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      accessibilityRole="alert"
    >
      {icon ?? <AlertTriangleIcon size={20} className={style.text} />}
      <Text variant="bodyMedium" className={["flex-1", style.text].join(" ")}>
        {message}
      </Text>
      {onDismiss ? (
        <IconButton
          icon={<DismissIcon size={20} className={style.text} />}
          accessibilityLabel="Dismiss"
          onPress={onDismiss}
        />
      ) : null}
    </View>
  );
}

export interface OfflineBannerProps {
  visible: boolean;
}

/** design/DESIGN.md section 11.1 "Offline banner", OFF-003 wording. */
export function OfflineBanner({ visible }: OfflineBannerProps) {
  if (!visible) return null;
  return (
    <Banner
      tone="neutral"
      message="You're offline. Changes will sync when you're back online."
    />
  );
}
