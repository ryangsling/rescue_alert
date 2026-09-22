import { render, screen, fireEvent } from "@testing-library/react-native";
import { SafetyCallout } from "../SafetyCallout";

describe("SafetyCallout", () => {
  it("renders the heading and every instruction", () => {
    render(
      <SafetyCallout
        tone="warning"
        heading="Do not approach yet"
        instructions={[
          "The animal appears disoriented.",
          "Contact a trained responder.",
        ]}
      />,
    );
    expect(screen.getByText("Do not approach yet")).toBeTruthy();
    expect(screen.getByText("The animal appears disoriented.")).toBeTruthy();
    expect(screen.getByText("Contact a trained responder.")).toBeTruthy();
  });

  it("renders no link when linkLabel is not given", () => {
    render(
      <SafetyCallout
        tone="information"
        heading="Note"
        instructions={["Text"]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("calls onLinkPress when the link is pressed", () => {
    const onLinkPress = jest.fn();
    render(
      <SafetyCallout
        tone="critical"
        heading="Bite risk"
        instructions={["Seek medical care."]}
        linkLabel="Read full safety guidance"
        onLinkPress={onLinkPress}
      />,
    );
    fireEvent.press(
      screen.getByRole("link", { name: "Read full safety guidance" }),
    );
    expect(onLinkPress).toHaveBeenCalledTimes(1);
  });
});
