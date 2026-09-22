import { useState, type PropsWithChildren } from "react";
import { Pressable, View } from "react-native";
import { Text } from "../primitives/Text";
import { PrivateIcon } from "@rescue-alert/icons";

export interface GraphicMediaCoverProps extends PropsWithChildren {
  className?: string;
}

/**
 * design/DESIGN.md sections 4.3, 11.10, 15: graphic case media is
 * blurred by default and requires an explicit reveal. `children` is
 * the actual media (an Image, typically).
 *
 * Before reveal, `children` is not rendered at all - only a solid,
 * opaque placeholder is. An earlier version rendered the media
 * underneath a translucent scrim overlay, which still let the
 * content show through at ~55% opacity; caught before it shipped.
 * React Native has no reliable cross-platform blur-filter primitive
 * without an extra native dependency, so "do not render it" is what
 * actually satisfies "never shown without a deliberate action".
 */
export function GraphicMediaCover({
  className,
  children,
}: GraphicMediaCoverProps) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <View className={className}>{children}</View>;
  }

  return (
    <Pressable
      className={[
        "min-h-12 items-center justify-center gap-2 rounded-medium bg-surface-strong p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      accessibilityRole="button"
      accessibilityLabel="Reveal graphic image"
      accessibilityHint="This image may be graphic. Tap to view."
      onPress={() => setRevealed(true)}
    >
      <PrivateIcon size={24} className="text-text-muted" />
      <Text variant="labelLarge" tone="muted">
        Tap to reveal
      </Text>
    </Pressable>
  );
}
