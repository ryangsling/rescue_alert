import { render, screen, fireEvent } from "@testing-library/react-native";
import { OutcomeSelector } from "../OutcomeSelector";

describe("OutcomeSelector", () => {
  it("renders every PRD 9.3 closure outcome", () => {
    render(<OutcomeSelector value={null} onChange={() => {}} />);
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
    render(<OutcomeSelector value="adopted" onChange={() => {}} />);
    expect(
      screen.getByRole("radio", { name: "Adopted" }).props.accessibilityState
        .checked,
    ).toBe(true);
  });

  it("calls onChange with the pressed outcome's value", () => {
    const onChange = jest.fn();
    render(<OutcomeSelector value={null} onChange={onChange} />);
    fireEvent.press(screen.getByRole("radio", { name: "Moved to shelter" }));
    expect(onChange).toHaveBeenCalledWith("moved_to_shelter");
  });
});
