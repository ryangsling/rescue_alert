import { render, screen, fireEvent } from "@testing-library/react-native";
import { Menu } from "../Menu";

const ITEMS = [
  { label: "Edit", onSelect: jest.fn() },
  { label: "Delete", onSelect: jest.fn(), destructive: true },
];

describe("Menu", () => {
  it("renders every item's label when visible", () => {
    render(<Menu visible onRequestClose={() => {}} items={ITEMS} />);
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("renders nothing when not visible", () => {
    render(<Menu visible={false} onRequestClose={() => {}} items={ITEMS} />);
    expect(screen.queryByText("Edit")).toBeNull();
  });

  it("calls the item's onSelect and closes the menu when pressed", () => {
    const onSelect = jest.fn();
    const onRequestClose = jest.fn();
    render(
      <Menu
        visible
        onRequestClose={onRequestClose}
        items={[{ label: "Merge duplicate", onSelect }]}
      />,
    );
    fireEvent.press(screen.getByRole("menuitem", { name: "Merge duplicate" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onSelect for a disabled item", () => {
    const onSelect = jest.fn();
    render(
      <Menu
        visible
        onRequestClose={() => {}}
        items={[{ label: "Merge", onSelect, disabled: true }]}
      />,
    );
    fireEvent.press(screen.getByRole("menuitem", { name: "Merge" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
