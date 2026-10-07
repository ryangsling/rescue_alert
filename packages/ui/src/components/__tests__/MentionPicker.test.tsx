import { fireEvent, render, screen } from "@testing-library/react-native";
import { MentionPicker } from "../MentionPicker";

describe("MentionPicker", () => {
  it("lists every candidate and calls onPick with the chosen one", () => {
    const onPick = jest.fn();
    render(
      <MentionPicker
        visible
        onRequestClose={jest.fn()}
        candidates={[
          { id: "u1", name: "Rahim" },
          { id: "u2", name: "Nusrat" },
        ]}
        onPick={onPick}
      />,
    );

    expect(screen.getByText("Rahim")).toBeTruthy();
    expect(screen.getByText("Nusrat")).toBeTruthy();
    fireEvent.press(screen.getByText("Nusrat"));
    expect(onPick).toHaveBeenCalledWith({ id: "u2", name: "Nusrat" });
  });
});
