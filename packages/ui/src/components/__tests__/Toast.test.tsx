import { render, screen, act } from "@testing-library/react-native";
import { Toast } from "../Toast";

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the message when visible", () => {
    render(<Toast visible message="Response accepted" onDismiss={() => {}} />);
    expect(screen.getByText("Response accepted")).toBeTruthy();
  });

  it("renders nothing when not visible", () => {
    render(
      <Toast
        visible={false}
        message="Response accepted"
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryByText("Response accepted")).toBeNull();
  });

  it("calls onDismiss automatically after the duration elapses", () => {
    const onDismiss = jest.fn();
    render(
      <Toast
        visible
        message="Draft saved"
        onDismiss={onDismiss}
        duration={1000}
      />,
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("never auto-dismisses when duration is 0", () => {
    const onDismiss = jest.fn();
    render(
      <Toast
        visible
        message="Draft saved"
        onDismiss={onDismiss}
        duration={0}
      />,
    );
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
