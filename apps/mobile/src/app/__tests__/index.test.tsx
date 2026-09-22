import { render, screen } from "@testing-library/react-native";
import Home from "../index";

describe("Home", () => {
  it("renders the Rescue Alert heading", () => {
    render(<Home />);
    expect(screen.getByText("Rescue Alert")).toBeTruthy();
  });
});
