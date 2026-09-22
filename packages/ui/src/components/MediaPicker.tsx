import { ActivityIndicator, Image, Pressable, View } from "react-native";
import { Text } from "../primitives/Text";
import {
  CameraIcon,
  AlertTriangleIcon,
  DismissIcon,
} from "@rescue-alert/icons";
import { IconButton } from "./IconButton";

export type MediaItemState = "uploading" | "uploaded" | "failed";

export interface MediaItem {
  id: string;
  uri: string;
  state: MediaItemState;
}

export interface MediaPickerProps {
  items: readonly MediaItem[];
  onAdd: () => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  maxItems?: number;
  className?: string;
}

/**
 * design/DESIGN.md section 11.3 "Image picker". CASE-004/CASE-005
 * (compression, EXIF stripping) and the actual capture/upload
 * mechanism are Part 8's job (need expo-image-picker and Supabase
 * Storage, neither wired in yet) - this component only presents
 * state a caller already has: pending upload, uploaded, or failed
 * with a retry action, per OFF-002.
 */
export function MediaPicker({
  items,
  onAdd,
  onRetry,
  onRemove,
  maxItems,
  className,
}: MediaPickerProps) {
  const atLimit = maxItems !== undefined && items.length >= maxItems;

  return (
    <View
      className={["flex-row flex-wrap gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <View
          key={item.id}
          className="h-20 w-20 overflow-hidden rounded-medium"
        >
          <Image
            source={{ uri: item.uri }}
            className="h-full w-full"
            resizeMode="cover"
          />
          {item.state === "uploading" ? (
            <View className="absolute inset-0 items-center justify-center bg-scrim">
              <ActivityIndicator color="white" accessibilityLabel="Uploading" />
            </View>
          ) : null}
          {item.state === "failed" ? (
            <Pressable
              className="absolute inset-0 items-center justify-center gap-1 bg-scrim"
              accessibilityRole="button"
              accessibilityLabel="Upload failed. Tap to retry."
              onPress={() => onRetry(item.id)}
            >
              <AlertTriangleIcon size={20} className="text-on-primary" />
              <Text variant="caption" className="text-on-primary">
                Retry
              </Text>
            </Pressable>
          ) : null}
          <View className="absolute right-0.5 top-0.5">
            <IconButton
              icon={<DismissIcon size={14} className="text-on-primary" />}
              accessibilityLabel="Remove photo"
              onPress={() => onRemove(item.id)}
              className="h-6 w-6 bg-scrim"
            />
          </View>
        </View>
      ))}
      {atLimit ? null : (
        <Pressable
          className="h-20 w-20 items-center justify-center rounded-medium border border-dashed border-border-strong"
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onAdd}
        >
          <CameraIcon size={24} className="text-text-muted" />
        </Pressable>
      )}
    </View>
  );
}
