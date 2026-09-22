import { render, screen, fireEvent } from "@testing-library/react-native";
import { RadioGroup } from "../RadioGroup";

const URGENCY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "urgent", label: "Urgent" },
] as const;

describe("RadioGroup", () => {
  it("marks the selected option as checked", () => {
    render(
      <RadioGroup
        label="Urgency"
        options={URGENCY_OPTIONS}
        value="urgent"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Urgent" }).props.accessibilityState
        .checked,
    ).toBe(true);
    expect(
      screen.getByRole("radio", { name: "Critical" }).props.accessibilityState
        .checked,
    ).toBe(false);
  });

  it("calls onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    render(
      <RadioGroup
        label="Urgency"
        options={URGENCY_OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByRole("radio", { name: "Critical" }));
    expect(onChange).toHaveBeenCalledWith("critical");
  });

  it("exposes a radiogroup role on the container", () => {
    render(
      <RadioGroup
        label="Urgency"
        options={URGENCY_OPTIONS}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Urgency" })).toBeTruthy();
  });
});
