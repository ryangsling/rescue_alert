import {
  SafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";

export interface SafeAreaContainerProps extends SafeAreaViewProps {
  className?: string;
}

/**
 * Safe-area-aware page container. design/DESIGN.md section 11.1.
 * Applies the background token so the safe-area insets themselves
 * (status bar, home indicator) never show raw white/black.
 */
export function SafeAreaContainer({
  className,
  ...props
}: SafeAreaContainerProps) {
  const classes = ["flex-1", "bg-background", className]
    .filter(Boolean)
    .join(" ");
  return <SafeAreaView className={classes} {...props} />;
}
