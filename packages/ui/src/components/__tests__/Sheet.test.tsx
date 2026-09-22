import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { Sheet } from "../Sheet";

describe("Sheet", () => {
  it("renders its content when visible", () => {
    render(
      <Sheet visible onRequestClose={() => {}}>
        <Text>Outcome options</Text>
      </Sheet>,
    );
    expect(screen.getByText("Outcome options")).toBeTruthy();
  });

  it("renders nothing visible when not visible", () => {
    render(
      <Sheet visible={false} onRequestClose={() => {}}>
        <Text>Outcome options</Text>
      </Sheet>,
    );
    expect(screen.queryByText("Outcome options")).toBeNull();
  });

  it("calls onRequestClose when the scrim is pressed", () => {
    const onRequestClose = jest.fn();
    render(
      <Sheet visible onRequestClose={onRequestClose}>
        <Text>Outcome options</Text>
      </Sheet>,
    );
    fireEvent.press(screen.getByLabelText("Dismiss sheet"));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onRequestClose when the sheet body itself is pressed", () => {
    const onRequestClose = jest.fn();
    render(
      <Sheet visible onRequestClose={onRequestClose}>
        <Text>Outcome options</Text>
      </Sheet>,
    );
    fireEvent.press(screen.getByText("Outcome options"));
    expect(onRequestClose).not.toHaveBeenCalled();
  });
});
