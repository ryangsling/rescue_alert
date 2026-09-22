import { render, screen, fireEvent } from "@testing-library/react-native";
import { Select } from "../Select";

const ANIMAL_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
] as const;

describe("Select", () => {
  it("shows the placeholder when no value is selected", () => {
    render(
      <Select
        label="Animal type"
        options={ANIMAL_OPTIONS}
        value={null}
        onChange={() => {}}
        placeholder="Choose one"
      />,
    );
    expect(screen.getByText("Choose one")).toBeTruthy();
  });

  it("shows the selected option's label", () => {
    render(
      <Select
        label="Animal type"
        options={ANIMAL_OPTIONS}
        value="cat"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Cat")).toBeTruthy();
  });

  it("opens the option menu when pressed", () => {
    render(
      <Select
        label="Animal type"
        options={ANIMAL_OPTIONS}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(screen.queryByRole("menuitem", { name: "Dog" })).toBeNull();
    fireEvent.press(screen.getByLabelText("Animal type"));
    expect(screen.getByRole("menuitem", { name: "Dog" })).toBeTruthy();
  });

  it("calls onChange with the selected option's value", () => {
    const onChange = jest.fn();
    render(
      <Select
        label="Animal type"
        options={ANIMAL_OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByLabelText("Animal type"));
    fireEvent.press(screen.getByRole("menuitem", { name: "Dog" }));
    expect(onChange).toHaveBeenCalledWith("dog");
  });
});
