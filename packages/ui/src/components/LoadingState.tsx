import { ActivityIndicator, View } from "react-native";
import { Text } from "../primitives/Text";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

/** design/DESIGN.md section 11.10 loading state. */
export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <View
      className={["flex-1 items-center justify-center gap-3 p-8", className]
        .filter(Boolean)
        .join(" ")}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? "Loading"}
    >
      <ActivityIndicator size="large" />
      {message ? (
        <Text tone="muted" className="text-center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
