import { fireEvent, render, screen } from "@testing-library/react-native";
import { WithdrawDialog } from "../WithdrawDialog";

const labels = {
  title: "Withdraw your commitment",
  reasonLabel: "Why are you withdrawing?",
  cancelLabel: "Cancel",
  confirmLabel: "Withdraw",
};

describe("WithdrawDialog", () => {
  it("disables confirm until a reason is entered, then confirms with the trimmed reason", () => {
    const onConfirm = jest.fn();
    render(
      <WithdrawDialog
        visible
        onRequestClose={jest.fn()}
        onConfirm={onConfirm}
        {...labels}
      />,
    );

    const confirmButton = screen.getByText("Withdraw");
    fireEvent.press(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByLabelText("Why are you withdrawing?"),
      "  no longer available  ",
    );
    fireEvent.press(confirmButton);
    expect(onConfirm).toHaveBeenCalledWith("no longer available");
  });

  it("calls onRequestClose when Cancel is pressed", () => {
    const onRequestClose = jest.fn();
    render(
      <WithdrawDialog
        visible
        onRequestClose={onRequestClose}
        onConfirm={jest.fn()}
        {...labels}
      />,
    );
    fireEvent.press(screen.getByText("Cancel"));
    expect(onRequestClose).toHaveBeenCalled();
  });
});
