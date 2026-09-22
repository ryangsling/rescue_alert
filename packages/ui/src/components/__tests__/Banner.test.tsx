import { render, screen, fireEvent } from "@testing-library/react-native";
import { Banner, OfflineBanner } from "../Banner";

describe("Banner", () => {
  it("renders the message", () => {
    render(
      <Banner message="The animal appears disoriented. Contact a trained responder." />,
    );
    expect(
      screen.getByText(
        "The animal appears disoriented. Contact a trained responder.",
      ),
    ).toBeTruthy();
  });

  it("exposes an alert role for the message region", () => {
    // Checked via UNSAFE_getByProps rather than RNTL's getByRole
    // query: this container is deliberately not `accessible`, since
    // Banner can contain an interactive dismiss IconButton that must
    // stay individually reachable - see the note on Banner.tsx.
    render(<Banner message="Do not approach yet" />);
    expect(
      screen.UNSAFE_getByProps({ accessibilityRole: "alert" }),
    ).toBeTruthy();
  });

  it("shows no dismiss control when onDismiss is not given", () => {
    render(<Banner message="Do not approach yet" />);
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
  });

  it("calls onDismiss when its dismiss control is pressed", () => {
    const onDismiss = jest.fn();
    render(<Banner message="Do not approach yet" onDismiss={onDismiss} />);
    fireEvent.press(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("OfflineBanner", () => {
  it("renders the offline message when visible", () => {
    render(<OfflineBanner visible />);
    expect(
      screen.getByText(
        "You're offline. Changes will sync when you're back online.",
      ),
    ).toBeTruthy();
  });

  it("renders nothing when not visible", () => {
    render(<OfflineBanner visible={false} />);
    expect(
      screen.queryByText(
        "You're offline. Changes will sync when you're back online.",
      ),
    ).toBeNull();
  });
});
