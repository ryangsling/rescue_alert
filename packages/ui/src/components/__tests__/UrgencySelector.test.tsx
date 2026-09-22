import { render, screen, fireEvent } from "@testing-library/react-native";
import { UrgencySelector } from "../UrgencySelector";

describe("UrgencySelector", () => {
  it("renders all four PRD 8.2 urgency levels", () => {
    render(<UrgencySelector value={null} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Critical" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Urgent" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Support needed" })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Adoption/community" }),
    ).toBeTruthy();
  });

  it("marks the selected level as checked and others as not", () => {
    render(<UrgencySelector value="urgent" onChange={() => {}} />);
    expect(
      screen.getByRole("radio", { name: "Urgent" }).props.accessibilityState
        .checked,
    ).toBe(true);
    expect(
      screen.getByRole("radio", { name: "Critical" }).props.accessibilityState
        .checked,
    ).toBe(false);
  });

  it("calls onChange with the pressed level", () => {
    const onChange = jest.fn();
    render(<UrgencySelector value={null} onChange={onChange} />);
    fireEvent.press(screen.getByRole("radio", { name: "Critical" }));
    expect(onChange).toHaveBeenCalledWith("critical");
  });

  it("declares the 44px minimum touch target class on every segment", () => {
    render(<UrgencySelector value={null} onChange={() => {}} />);
    expect(
      screen.getByRole("radio", { name: "Critical" }).props.className,
    ).toContain("min-h-11");
  });
});
