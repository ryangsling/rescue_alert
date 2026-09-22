import { useEffect } from "react";
import { View } from "react-native";
import { Text } from "../primitives/Text";
import { Surface } from "../primitives/Surface";
import { motion } from "@rescue-alert/design-tokens";

export interface ToastProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. 0 disables auto-dismiss. */
  duration?: number;
}

/**
 * design/DESIGN.md section 11.1. A confirmation-style transient
 * message ("Response accepted", "Draft saved") - never used for
 * anything requiring an action, which belongs in Dialog or Banner.
 */
export function Toast({
  visible,
  message,
  onDismiss,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!visible || duration === 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View
      className="absolute inset-x-4 bottom-6 items-center"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Surface elevation="level2" className="max-w-sm px-4 py-3">
        <Text variant="bodyMedium">{message}</Text>
      </Surface>
    </View>
  );
}

/** Referenced in motion.ts so this component's transition timing stays token-driven, not a magic number. */
export const TOAST_TRANSITION_MS = motion.standard;
