import { render, screen, fireEvent } from "@testing-library/react-native";
import { Switch } from "../Switch";

describe("Switch", () => {
  it("reports its value to assistive technology via accessibilityLabel", () => {
    render(<Switch label="Available now" value onChange={() => {}} />);
    expect(screen.getByLabelText("Available now")).toBeTruthy();
  });

  it("calls onChange with the new value", () => {
    const onChange = jest.fn();
    render(<Switch label="Available now" value={false} onChange={onChange} />);
    fireEvent(screen.getByLabelText("Available now"), "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders help text", () => {
    render(
      <Switch
        label="Critical alert override"
        value={false}
        onChange={() => {}}
        helpText="Overrides quiet hours"
      />,
    );
    expect(screen.getByText("Overrides quiet hours")).toBeTruthy();
  });
});
