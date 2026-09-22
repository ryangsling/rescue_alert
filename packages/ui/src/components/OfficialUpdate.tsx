import { View } from "react-native";
import { Text } from "../primitives/Text";

export interface OfficialUpdateProps {
  actorName: string;
  /** e.g. "Coordinator", "Organization member", "Moderator". */
  actorRole: string;
  timestampLabel: string;
  /** e.g. "Status update", "Safety notice". */
  updateType: string;
  body: string;
  isPinned?: boolean;
  className?: string;
}

/**
 * design/DESIGN.md section 11.7. A left semantic accent (a colored
 * left border) is what keeps this visually distinct from
 * CaseComment/CommentReply at a glance, per COMM-003 - it must never
 * be confusable with an ordinary comment.
 */
export function OfficialUpdate({
  actorName,
  actorRole,
  timestampLabel,
  updateType,
  body,
  isPinned = false,
  className,
}: OfficialUpdateProps) {
  return (
    <View
      testID="official-update-accent"
      className={[
        "gap-1 rounded-medium border-l-4 border-l-primary bg-primary-container p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-baseline gap-2">
          <Text variant="labelLarge" className="text-on-primary-container">
            {actorName}
          </Text>
          <Text variant="caption" className="text-on-primary-container">
            {actorRole}
          </Text>
        </View>
        {isPinned ? (
          <Text variant="labelMedium" className="text-on-primary-container">
            Pinned
          </Text>
        ) : null}
      </View>
      <Text variant="labelMedium" className="text-on-primary-container">
        {updateType}
      </Text>
      <Text className="text-on-primary-container">{body}</Text>
      <Text variant="caption" className="text-on-primary-container">
        {timestampLabel}
      </Text>
    </View>
  );
}
