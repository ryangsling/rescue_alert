import { render, screen, fireEvent } from "@testing-library/react-native";
import { CaseHeader } from "../CaseHeader";

const BASE_PROPS = {
  urgency: "critical" as const,
  title: "Injured dog near Dhanmondi 27",
  areaLabel: "Dhanmondi",
  distanceLabel: "2.4 km away",
  lastUpdateLabel: "Updated 2 minutes ago",
  statusLabel: "Responder en route",
  statusTone: "support" as const,
};

describe("CaseHeader", () => {
  it("renders urgency, title, location, distance, last update, and status", () => {
    render(<CaseHeader {...BASE_PROPS} />);
    expect(screen.getByText("Critical")).toBeTruthy();
    expect(screen.getByText("Injured dog near Dhanmondi 27")).toBeTruthy();
    expect(screen.getByText("Dhanmondi - 2.4 km away")).toBeTruthy();
    expect(screen.getByText("Updated 2 minutes ago")).toBeTruthy();
    expect(screen.getByText("Responder en route")).toBeTruthy();
  });

  it("renders no share/report controls when their handlers are not given", () => {
    render(<CaseHeader {...BASE_PROPS} />);
    expect(screen.queryByLabelText("Share")).toBeNull();
    expect(screen.queryByLabelText("Report this case")).toBeNull();
  });

  it("calls onShare and onReport independently", () => {
    const onShare = jest.fn();
    const onReport = jest.fn();
    render(
      <CaseHeader {...BASE_PROPS} onShare={onShare} onReport={onReport} />,
    );
    fireEvent.press(screen.getByLabelText("Share"));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onReport).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Report this case"));
    expect(onReport).toHaveBeenCalledTimes(1);
  });
});
