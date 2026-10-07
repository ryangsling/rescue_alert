import { fireEvent, render, screen } from "@testing-library/react-native";
import { Comment } from "../Comment";

const segments = [{ type: "text" as const, text: "I'm on my way" }];

describe("Comment", () => {
  it("renders author, timestamp, and body", () => {
    render(
      <Comment
        authorName="Rahim"
        timestampLabel="2 minutes ago"
        segments={segments}
      />,
    );
    expect(screen.getByText("Rahim")).toBeTruthy();
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
    expect(screen.getByText("I'm on my way")).toBeTruthy();
  });

  it("shows an edited marker when isEdited", () => {
    render(
      <Comment
        authorName="Rahim"
        timestampLabel="2 minutes ago"
        segments={segments}
        isEdited
      />,
    );
    expect(screen.getByText("(edited)")).toBeTruthy();
  });

  it("shows a moderation placeholder instead of the body when hidden", () => {
    render(
      <Comment
        authorName="Rahim"
        timestampLabel="2 minutes ago"
        segments={segments}
        isHidden
      />,
    );
    expect(screen.queryByText("I'm on my way")).toBeNull();
    expect(
      screen.getByText("This content was hidden by a moderator."),
    ).toBeTruthy();
  });

  it("opens the action menu and fires the selected action", () => {
    const onHide = jest.fn();
    render(
      <Comment
        authorName="Rahim"
        timestampLabel="2 minutes ago"
        segments={segments}
        actions={[{ label: "Hide", onSelect: onHide }]}
      />,
    );
    fireEvent.press(screen.getByLabelText("More actions"));
    fireEvent.press(screen.getByText("Hide"));
    expect(onHide).toHaveBeenCalled();
  });
});
