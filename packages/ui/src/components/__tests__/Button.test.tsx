import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button, type ButtonVariant } from "../Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button onPress={() => {}}>I can help</Button>);
    expect(screen.getByText("I can help")).toBeTruthy();
  });

  it("exposes an accessible button role", () => {
    render(<Button onPress={() => {}}>Report an animal</Button>);
    expect(
      screen.getByRole("button", { name: "Report an animal" }),
    ).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Submit</Button>);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports disabled state to assistive technology and blocks presses", () => {
    const onPress = jest.fn();
    render(
      <Button onPress={onPress} disabled>
        Submit
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reports busy state while loading", () => {
    render(
      <Button onPress={() => {}} loading>
        Submit
      </Button>,
    );
    expect(screen.getByRole("button").props.accessibilityState.busy).toBe(true);
  });

  // design/DESIGN.md section 11.2: 48px minimum height for every variant.
  it.each<ButtonVariant>([
    "primary",
    "secondary",
    "tonal",
    "outline",
    "text",
    "destructive",
    "floating",
  ])("variant %s declares the 48px minimum height class", (variant) => {
    render(
      <Button variant={variant} onPress={() => {}}>
        Action
      </Button>,
    );
    expect(screen.getByRole("button").props.className).toContain("min-h-12");
  });
});
