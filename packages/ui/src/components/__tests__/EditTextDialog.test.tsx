import { fireEvent, render, screen } from "@testing-library/react-native";
import { EditTextDialog } from "../EditTextDialog";

const labels = {
  title: "Edit comment",
  bodyLabel: "Comment",
  cancelLabel: "Cancel",
  confirmLabel: "Save",
};

describe("EditTextDialog", () => {
  it("pre-fills the body and confirms with the trimmed, edited value", () => {
    const onConfirm = jest.fn();
    render(
      <EditTextDialog
        visible
        onRequestClose={jest.fn()}
        onConfirm={onConfirm}
        initialValue="original text"
        {...labels}
      />,
    );

    const input = screen.getByLabelText("Comment");
    expect(input.props.value).toBe("original text");

    fireEvent.changeText(input, "  edited text  ");
    fireEvent.press(screen.getByText("Save"));
    expect(onConfirm).toHaveBeenCalledWith("edited text");
  });

  it("disables save when the body is emptied", () => {
    const onConfirm = jest.fn();
    render(
      <EditTextDialog
        visible
        onRequestClose={jest.fn()}
        onConfirm={onConfirm}
        initialValue="original text"
        {...labels}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Comment"), "   ");
    fireEvent.press(screen.getByText("Save"));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
