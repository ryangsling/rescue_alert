import { fireEvent, render, screen } from "@testing-library/react-native";
import { ReportDialog } from "../ReportDialog";

const reasonOptions = [
  { value: "harassment" as const, label: "Harassment" },
  { value: "spam" as const, label: "Spam" },
];

describe("ReportDialog", () => {
  it("disables submit until a reason is chosen, then submits reason and details", () => {
    const onConfirm = jest.fn();
    render(
      <ReportDialog
        visible
        onRequestClose={jest.fn()}
        reasonOptions={reasonOptions}
        onConfirm={onConfirm}
      />,
    );

    const submit = screen.getByText("Submit report");
    fireEvent.press(submit);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Harassment"));
    fireEvent.changeText(
      screen.getByLabelText(
        "Anything else moderators should know? (optional)",
      ),
      "repeated unwanted contact",
    );
    fireEvent.press(submit);
    expect(onConfirm).toHaveBeenCalledWith(
      "harassment",
      "repeated unwanted contact",
    );
  });
});
