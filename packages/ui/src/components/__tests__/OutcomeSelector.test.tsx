import { render, screen, fireEvent } from "@testing-library/react-native";
import { OutcomeSelector } from "../OutcomeSelector";

const OPTIONS = [
  { value: "successfully_rescued" as const, label: "Successfully rescued" },
  { value: "adopted" as const, label: "Adopted" },
  { value: "moved_to_shelter" as const, label: "Moved to shelter" },
  {
    value: "died_before_help_arrived" as const,
    label: "Animal died before help arrived",
  },
  {
    value: "other_documented_outcome" as const,
    label: "Other documented outcome",
  },
];

describe("OutcomeSelector", () => {
  it("renders every option it is given, with no English text of its own", () => {
    render(
      <OutcomeSelector
        label="Outcome"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Successfully rescued" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Animal died before help arrived" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Other documented outcome" }),
    ).toBeTruthy();
  });

  it("marks the selected outcome as checked", () => {
    render(
      <OutcomeSelector
        label="Outcome"
        options={OPTIONS}
        value="adopted"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Adopted" }).props.accessibilityState
        .checked,
    ).toBe(true);
  });

  it("calls onChange with the pressed outcome's value", () => {
    const onChange = jest.fn();
    render(
      <OutcomeSelector
        label="Outcome"
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByRole("radio", { name: "Moved to shelter" }));
    expect(onChange).toHaveBeenCalledWith("moved_to_shelter");
  });
});
