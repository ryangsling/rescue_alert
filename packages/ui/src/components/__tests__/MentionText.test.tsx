import { render, screen } from "@testing-library/react-native";
import { MentionText } from "../MentionText";

describe("MentionText", () => {
  it("renders plain text with no mention", () => {
    render(<MentionText segments={[{ type: "text", text: "no mentions" }]} />);
    expect(screen.getByText("no mentions")).toBeTruthy();
  });

  it("renders a mention segment with an @ prefix", () => {
    render(
      <MentionText
        segments={[
          { type: "text", text: "cc " },
          { type: "mention", text: "Rahim" },
          { type: "text", text: " please help" },
        ]}
      />,
    );
    expect(screen.getByText("@Rahim")).toBeTruthy();
    expect(screen.getByText("cc ")).toBeTruthy();
    expect(screen.getByText(" please help")).toBeTruthy();
  });
});
