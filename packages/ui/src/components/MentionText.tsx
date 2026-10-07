import { Text as RNText, View } from "react-native";
import { Text } from "../primitives/Text";

export interface MentionTextSegment {
  type: "text" | "mention";
  text: string;
}

export interface MentionTextProps {
  /** Pre-split by the caller (packages/validation's splitMentionSegments) - this component only renders. */
  segments: readonly MentionTextSegment[];
  className?: string;
}

/**
 * Renders a comment/reply/update body with an @mention shown as a
 * distinct pill rather than raw markup.
 */
export function MentionText({ segments, className }: MentionTextProps) {
  if (segments.length === 1 && segments[0]!.type === "text") {
    return (
      <Text variant="bodyMedium" className={className}>
        {segments[0]!.text}
      </Text>
    );
  }

  return (
    <View
      className={["flex-row flex-wrap items-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      {segments.map((segment, index) =>
        segment.type === "mention" ? (
          <RNText
            key={index}
            accessibilityRole="text"
            className="rounded-small bg-primary-container px-1 text-primary"
          >
            @{segment.text}
          </RNText>
        ) : (
          <Text key={index} variant="bodyMedium">
            {segment.text}
          </Text>
        ),
      )}
    </View>
  );
}
