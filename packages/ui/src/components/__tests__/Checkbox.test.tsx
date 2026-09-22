import { render, screen, fireEvent } from "@testing-library/react-native";
import { Checkbox } from "../Checkbox";

describe("Checkbox", () => {
  it("reports checked state to assistive technology", () => {
    render(
      <Checkbox label="I am at the location" checked onChange={() => {}} />,
    );
    expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(
      true,
    );
  });

  it("toggles on press", () => {
    const onChange = jest.fn();
    render(
      <Checkbox
        label="I am at the location"
        checked={false}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onChange = jest.fn();
    render(
      <Checkbox
        label="I am at the location"
        checked={false}
        onChange={onChange}
        disabled
      />,
    );
    fireEvent.press(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows error text when given", () => {
    render(
      <Checkbox
        label="Accept terms"
        checked={false}
        onChange={() => {}}
        errorText="Required"
      />,
    );
    expect(screen.getByText("Required")).toBeTruthy();
  });
});
