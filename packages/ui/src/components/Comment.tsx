import { useState } from "react";
import { View } from "react-native";
import { Text } from "../primitives/Text";
import { MentionText, type MentionTextSegment } from "./MentionText";
import { IconButton } from "./IconButton";
import { Menu, type MenuItem } from "./Menu";
import { MoreIcon } from "@rescue-alert/icons";

export interface CommentProps {
  authorName: string;
  timestampLabel: string;
  segments: readonly MentionTextSegment[];
  isEdited?: boolean;
  /** Hidden content shows a muted placeholder instead of the body (moderation evidence is preserved in the data, not shown here). */
  isHidden?: boolean;
  /** Edit/Hide/Report, resolved by the caller from the viewer's role - this component renders whatever it is given. */
  actions?: readonly MenuItem[];
  className?: string;
}

/** design/DESIGN.md section 20 "comments and replies" - COMM-001. */
export function Comment({
  authorName,
  timestampLabel,
  segments,
  isEdited = false,
  isHidden = false,
  actions,
  className,
}: CommentProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View
      className={["gap-1 rounded-medium bg-surface p-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-baseline gap-2">
          <Text variant="labelLarge">{authorName}</Text>
          <Text variant="caption" tone="muted">
            {timestampLabel}
          </Text>
          {isEdited ? (
            <Text variant="caption" tone="muted">
              (edited)
            </Text>
          ) : null}
        </View>
        {actions && actions.length > 0 ? (
          <IconButton
            icon={<MoreIcon size={18} />}
            accessibilityLabel="More actions"
            onPress={() => setMenuVisible(true)}
          />
        ) : null}
      </View>

      {isHidden ? (
        <Text variant="bodyMedium" tone="muted">
          This content was hidden by a moderator.
        </Text>
      ) : (
        <MentionText segments={segments} />
      )}

      {actions ? (
        <Menu
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
          items={actions}
        />
      ) : null}
    </View>
  );
}
