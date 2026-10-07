import type { ReactNode } from "react";
import { View } from "react-native";
import { Comment, type CommentProps } from "./Comment";
import { Button } from "./Button";

export interface CommentThreadItem {
  id: string;
  comment: CommentProps;
  replies: readonly (CommentProps & { id: string })[];
}

export interface CommentThreadProps {
  items: readonly CommentThreadItem[];
  /** Omitted entirely when replying is not available (e.g. the case is closed). */
  onReplyPress?: (commentId: string) => void;
  /** The composer the caller renders inline under the comment being replied to - CommentThread only places it. */
  replyComposer?: { commentId: string; node: ReactNode } | null;
  className?: string;
}

/** design/DESIGN.md section 20 - replies nest one level under their comment, per COMM-001. */
export function CommentThread({
  items,
  onReplyPress,
  replyComposer,
  className,
}: CommentThreadProps) {
  return (
    <View className={["gap-4", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <View key={item.id} className="gap-2">
          <Comment {...item.comment} />
          {onReplyPress ? (
            <View className="ml-3">
              <Button variant="text" onPress={() => onReplyPress(item.id)}>
                Reply
              </Button>
            </View>
          ) : null}
          {replyComposer?.commentId === item.id ? (
            <View className="ml-6">{replyComposer.node}</View>
          ) : null}
          {item.replies.length > 0 ? (
            <View className="ml-6 gap-2">
              {item.replies.map((reply) => (
                <Comment key={reply.id} {...reply} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
