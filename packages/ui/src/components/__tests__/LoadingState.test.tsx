import { render, screen } from "@testing-library/react-native";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("exposes a progressbar role", () => {
    render(<LoadingState />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("renders the message when given", () => {
    render(<LoadingState message="Loading case details" />);
    expect(screen.getByText("Loading case details")).toBeTruthy();
  });

  it("falls back to a generic accessibility label with no message", () => {
    render(<LoadingState />);
    expect(screen.getByLabelText("Loading")).toBeTruthy();
  });
});
