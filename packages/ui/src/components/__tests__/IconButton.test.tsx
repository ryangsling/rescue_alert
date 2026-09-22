import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("requires and exposes an accessibility label, since it has no visible text", () => {
    render(
      <IconButton
        icon={<Text>*</Text>}
        accessibilityLabel="Open filters"
        onPress={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Open filters" })).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(
      <IconButton
        icon={<Text>*</Text>}
        accessibilityLabel="Close"
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // design/DESIGN.md section 15: 44x44 minimum touch target.
  it("declares the 44x44 minimum touch target class", () => {
    render(
      <IconButton
        icon={<Text>*</Text>}
        accessibilityLabel="Close"
        onPress={() => {}}
      />,
    );
    const className = screen.getByRole("button").props.className as string;
    expect(className).toContain("h-11");
    expect(className).toContain("w-11");
  });

  it("reports disabled state and blocks presses", () => {
    const onPress = jest.fn();
    render(
      <IconButton
        icon={<Text>*</Text>}
        accessibilityLabel="Close"
        onPress={onPress}
        disabled
      />,
    );
    const button = screen.getByRole("button");
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
