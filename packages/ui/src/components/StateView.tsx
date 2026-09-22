import { View } from "react-native";
import { Text } from "../primitives/Text";
import { Button } from "./Button";
import {
  EmptyStateIcon,
  OfflineIcon,
  PrivateIcon,
  ErrorIcon,
} from "@rescue-alert/icons";
import type { LucideIcon } from "@rescue-alert/icons";

export type StateViewVariant =
  "empty" | "offline" | "permission-denied" | "partial-failure" | "error";

export interface StateViewProps {
  variant: StateViewVariant;
  heading: string;
  /** design/DESIGN.md section 17.3 error pattern: what happened, whether data is safe, what to do next. */
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const VARIANT_ICON: Record<StateViewVariant, LucideIcon> = {
  empty: EmptyStateIcon,
  offline: OfflineIcon,
  "permission-denied": PrivateIcon,
  "partial-failure": ErrorIcon,
  error: ErrorIcon,
};

/**
 * design/DESIGN.md section 11.10: empty, offline, permission-denied,
 * partial-failure, and full error states, as one reusable shell (they
 * share the same icon + heading + message + optional action shape -
 * loading is different enough, structurally, to be its own
 * LoadingState component instead). Section 17.3: never blame the
 * user, preserve drafts, offer a clear recovery action.
 */
export function StateView({
  variant,
  heading,
  message,
  actionLabel,
  onAction,
  className,
}: StateViewProps) {
  const Icon = VARIANT_ICON[variant];

  return (
    <View
      className={["flex-1 items-center justify-center gap-3 p-8", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon size={32} className="text-text-muted" />
      <Text variant="titleMedium" className="text-center">
        {heading}
      </Text>
      <Text tone="muted" className="text-center">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
