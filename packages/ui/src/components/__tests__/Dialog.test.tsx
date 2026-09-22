import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { Dialog } from "../Dialog";

describe("Dialog", () => {
  it("renders its title and content when visible", () => {
    render(
      <Dialog visible title="Close case" onRequestClose={() => {}}>
        <Text>Select an outcome</Text>
      </Dialog>,
    );
    expect(screen.getByText("Close case")).toBeTruthy();
    expect(screen.getByText("Select an outcome")).toBeTruthy();
  });

  it("renders nothing visible when not visible", () => {
    render(
      <Dialog visible={false} title="Close case" onRequestClose={() => {}}>
        <Text>Select an outcome</Text>
      </Dialog>,
    );
    expect(screen.queryByText("Select an outcome")).toBeNull();
  });

  it("calls onRequestClose when the scrim is pressed", () => {
    const onRequestClose = jest.fn();
    render(
      <Dialog visible title="Close case" onRequestClose={onRequestClose}>
        <Text>Select an outcome</Text>
      </Dialog>,
    );
    fireEvent.press(screen.getByLabelText("Dismiss dialog"));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onRequestClose when the dialog body itself is pressed", () => {
    const onRequestClose = jest.fn();
    render(
      <Dialog visible title="Close case" onRequestClose={onRequestClose}>
        <Text>Select an outcome</Text>
      </Dialog>,
    );
    fireEvent.press(screen.getByText("Select an outcome"));
    expect(onRequestClose).not.toHaveBeenCalled();
  });
});
