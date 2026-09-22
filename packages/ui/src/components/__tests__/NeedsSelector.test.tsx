import { render, screen, fireEvent } from "@testing-library/react-native";
import { NeedsSelector } from "../NeedsSelector";

describe("NeedsSelector", () => {
  it("renders every need's label", () => {
    render(
      <NeedsSelector
        needs={[
          { type: "transport", isFulfilled: false },
          { type: "veterinary_treatment", isFulfilled: true },
        ]}
      />,
    );
    expect(screen.getByText("Transport")).toBeTruthy();
    expect(screen.getByText("Veterinary treatment")).toBeTruthy();
  });

  it("distinguishes fulfilled from unfulfilled needs by checked state, not text alone", () => {
    render(
      <NeedsSelector
        needs={[
          { type: "transport", isFulfilled: false },
          { type: "veterinary_treatment", isFulfilled: true },
        ]}
        onToggle={() => {}}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Transport" }).props
        .accessibilityState.checked,
    ).toBe(false);
    expect(
      screen.getByRole("checkbox", { name: "Veterinary treatment" }).props
        .accessibilityState.checked,
    ).toBe(true);
  });

  it("renders as read-only (no checkbox role) when onToggle is not given", () => {
    render(
      <NeedsSelector needs={[{ type: "transport", isFulfilled: false }]} />,
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("calls onToggle with the pressed need's type", () => {
    const onToggle = jest.fn();
    render(
      <NeedsSelector
        needs={[{ type: "transport", isFulfilled: false }]}
        onToggle={onToggle}
      />,
    );
    fireEvent.press(screen.getByRole("checkbox", { name: "Transport" }));
    expect(onToggle).toHaveBeenCalledWith("transport");
  });
});
