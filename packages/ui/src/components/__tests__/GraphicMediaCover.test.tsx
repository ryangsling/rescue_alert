import { render, screen, fireEvent } from "@testing-library/react-native";
import { Image } from "react-native";
import { GraphicMediaCover } from "../GraphicMediaCover";

describe("GraphicMediaCover", () => {
  it("does not render the media before it is revealed", () => {
    render(
      <GraphicMediaCover>
        <Image
          testID="graphic-media"
          source={{ uri: "https://example.test/case.jpg" }}
        />
      </GraphicMediaCover>,
    );
    expect(screen.queryByTestId("graphic-media")).toBeNull();
  });

  it("shows a reveal control before reveal", () => {
    render(
      <GraphicMediaCover>
        <Image
          testID="graphic-media"
          source={{ uri: "https://example.test/case.jpg" }}
        />
      </GraphicMediaCover>,
    );
    expect(
      screen.getByRole("button", { name: "Reveal graphic image" }),
    ).toBeTruthy();
  });

  it("renders the media only after the reveal control is pressed", () => {
    render(
      <GraphicMediaCover>
        <Image
          testID="graphic-media"
          source={{ uri: "https://example.test/case.jpg" }}
        />
      </GraphicMediaCover>,
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Reveal graphic image" }),
    );
    expect(screen.getByTestId("graphic-media")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Reveal graphic image" }),
    ).toBeNull();
  });
});
