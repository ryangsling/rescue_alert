import { Image, View } from "react-native";
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
  /** Translated by the caller; shown only when isPinned is true. */
  pinnedLabel?: string;
  /** Signed URLs for any media attached to this update (Part 12). */
  mediaUris?: readonly string[];
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
  pinnedLabel,
  mediaUris,
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
        {isPinned && pinnedLabel ? (
          <Text variant="labelMedium" className="text-on-primary-container">
            {pinnedLabel}
          </Text>
        ) : null}
      </View>
      <Text variant="labelMedium" className="text-on-primary-container">
        {updateType}
      </Text>
      <Text className="text-on-primary-container">{body}</Text>
      {mediaUris && mediaUris.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {mediaUris.map((uri) => (
            <Image
              key={uri}
              testID="official-update-media"
              source={{ uri }}
              className="h-20 w-20 rounded-medium"
            />
          ))}
        </View>
      ) : null}
      <Text variant="caption" className="text-on-primary-container">
        {timestampLabel}
      </Text>
    </View>
  );
}
