import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { CommentThread } from "../CommentThread";

const segments = [{ type: "text" as const, text: "body" }];

describe("CommentThread", () => {
  it("renders comments with their nested replies indented under them", () => {
    render(
      <CommentThread
        items={[
          {
            id: "c1",
            comment: {
              authorName: "Creator",
              timestampLabel: "1h ago",
              segments,
            },
            replies: [
              {
                id: "r1",
                authorName: "Responder",
                timestampLabel: "50m ago",
                segments: [{ type: "text", text: "reply body" }],
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Creator")).toBeTruthy();
    expect(screen.getByText("Responder")).toBeTruthy();
    expect(screen.getByText("reply body")).toBeTruthy();
  });

  it("calls onReplyPress with the comment id", () => {
    const onReplyPress = jest.fn();
    render(
      <CommentThread
        items={[
          {
            id: "c1",
            comment: {
              authorName: "Creator",
              timestampLabel: "1h ago",
              segments,
            },
            replies: [],
          },
        ]}
        onReplyPress={onReplyPress}
      />,
    );
    fireEvent.press(screen.getByText("Reply"));
    expect(onReplyPress).toHaveBeenCalledWith("c1");
  });

  it("places the reply composer under the comment it targets", () => {
    render(
      <CommentThread
        items={[
          {
            id: "c1",
            comment: {
              authorName: "Creator",
              timestampLabel: "1h ago",
              segments,
            },
            replies: [],
          },
        ]}
        replyComposer={{
          commentId: "c1",
          node: <Text>composer here</Text>,
        }}
      />,
    );
    expect(screen.getByText("composer here")).toBeTruthy();
  });
});
