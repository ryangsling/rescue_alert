import { render, screen, fireEvent } from "@testing-library/react-native";
import { TextArea } from "../TextArea";

describe("TextArea", () => {
  it("renders as multiline", () => {
    render(<TextArea label="Description" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText("Description").props.multiline).toBe(true);
  });

  it("calls onChangeText when edited", () => {
    const onChangeText = jest.fn();
    render(
      <TextArea label="Description" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Description"),
      "Found near the lake",
    );
    expect(onChangeText).toHaveBeenCalledWith("Found near the lake");
  });

  it("grows its minimum height with the rows prop", () => {
    render(
      <TextArea
        label="Description"
        value=""
        onChangeText={() => {}}
        rows={6}
      />,
    );
    const style = screen.getByLabelText("Description").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.minHeight).toBeGreaterThan(100);
  });
});
