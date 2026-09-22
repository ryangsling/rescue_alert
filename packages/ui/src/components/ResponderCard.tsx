import { View } from "react-native";
import { Text } from "../primitives/Text";
import { VerifiedIcon } from "@rescue-alert/icons";
import { StatusChip, type StatusChipTone } from "./StatusChip";
import { Button } from "./Button";

export interface ResponderCardProps {
  /** Responder or organization identity. */
  name: string;
  isVerified?: boolean;
  verifiedByLabel?: string;
  /** Assistance type(s), e.g. "On-site rescue, Transport". */
  assistanceTypeLabel: string;
  /** ETA or availability, e.g. "Arriving in ~10 minutes". */
  availabilityLabel?: string;
  /** Current commitment state. */
  statusLabel: string;
  statusTone: StatusChipTone;
  /**
   * The caller must set this true to render phoneNumber - a defense
   * in depth check, not the sole gate (the confirmed decision is
   * enforced server-side per Part 3's RLS; this is a second check
   * against a caller passing a phone number by mistake).
   */
  isAuthorizedViewer?: boolean;
  phoneNumber?: string;
  coordinatorActions?: { label: string; onPress: () => void }[];
  className?: string;
}

/**
 * design/DESIGN.md section 11.8. Phone numbers and live locations
 * must not appear without authorization - see isAuthorizedViewer.
 */
export function ResponderCard({
  name,
  isVerified = false,
  verifiedByLabel,
  assistanceTypeLabel,
  availabilityLabel,
  statusLabel,
  statusTone,
  isAuthorizedViewer = false,
  phoneNumber,
  coordinatorActions,
  className,
}: ResponderCardProps) {
  const showPhone = isAuthorizedViewer && Boolean(phoneNumber);

  return (
    <View
      className={[
        "gap-2 rounded-medium border border-border bg-surface p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="flex-row items-center gap-2">
        <Text variant="titleMedium">{name}</Text>
        {isVerified ? (
          <View className="flex-row items-center gap-1">
            <VerifiedIcon size={16} className="text-support" />
            {verifiedByLabel ? (
              <Text variant="caption" tone="muted">
                {verifiedByLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <Text variant="bodyMedium">{assistanceTypeLabel}</Text>
      {availabilityLabel ? (
        <Text variant="bodyMedium" tone="muted">
          {availabilityLabel}
        </Text>
      ) : null}
      {showPhone ? <Text variant="bodyMedium">{phoneNumber}</Text> : null}
      <StatusChip tone={statusTone} label={statusLabel} />
      {coordinatorActions && coordinatorActions.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {coordinatorActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onPress={action.onPress}
            >
              {action.label}
            </Button>
          ))}
        </View>
      ) : null}
    </View>
  );
}
