import { render, screen, fireEvent } from "@testing-library/react-native";
import { StateView, type StateViewVariant } from "../StateView";

describe("StateView", () => {
  it.each<StateViewVariant>([
    "empty",
    "offline",
    "permission-denied",
    "partial-failure",
    "error",
  ])("renders heading and message for variant %s", (variant) => {
    render(
      <StateView
        variant={variant}
        heading="Nothing here yet"
        message="Try again later."
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
    expect(screen.getByText("Try again later.")).toBeTruthy();
  });

  it("shows no action when actionLabel/onAction are not given", () => {
    render(
      <StateView
        variant="error"
        heading="Something went wrong"
        message="Please retry."
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls onAction when the action button is pressed", () => {
    const onAction = jest.fn();
    render(
      <StateView
        variant="offline"
        heading="You're offline"
        message="Changes will sync when you're back online."
        actionLabel="Retry"
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
