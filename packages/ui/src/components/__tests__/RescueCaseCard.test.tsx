import { render, screen, fireEvent } from "@testing-library/react-native";
import { RescueCaseCard } from "../RescueCaseCard";

const BASE_PROPS = {
  urgency: "urgent" as const,
  title: "Injured dog near Dhanmondi 27",
  areaLabel: "Dhanmondi",
  lastUpdateLabel: "Animal last seen 12 minutes ago",
  statusLabel: "Open",
  statusTone: "support" as const,
};

describe("RescueCaseCard", () => {
  it("renders all eight required elements (DESIGN.md 11.5)", () => {
    render(
      <RescueCaseCard
        {...BASE_PROPS}
        thumbnailUri="https://example.test/case.jpg"
        distanceLabel="2.4 km away"
        remainingNeeds={["transport", "veterinary care"]}
        primaryActionLabel="I can help"
        onPrimaryAction={() => {}}
      />,
    );
    expect(screen.getByText("Urgent")).toBeTruthy(); // urgency badge
    expect(screen.getByText("Injured dog near Dhanmondi 27")).toBeTruthy(); // title
    expect(screen.getByText("Dhanmondi - 2.4 km away")).toBeTruthy(); // area + distance
    expect(screen.getByText("Animal last seen 12 minutes ago")).toBeTruthy(); // time since
    expect(screen.getByText("Open")).toBeTruthy(); // response state
    expect(
      screen.getByText("Still needed: transport, veterinary care"),
    ).toBeTruthy(); // remaining needs
    expect(screen.getByRole("button", { name: "I can help" })).toBeTruthy(); // primary action
  });

  it("never displays a likes, popularity, or report count", () => {
    render(<RescueCaseCard {...BASE_PROPS} />);
    expect(screen.queryByText(/like/i)).toBeNull();
    expect(screen.queryByText(/\d+\s*(likes|views|reports)/i)).toBeNull();
  });

  it("calls onPress when the card itself is pressed", () => {
    const onPress = jest.fn();
    render(<RescueCaseCard {...BASE_PROPS} onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: BASE_PROPS.title }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders correctly with বাংলা and mixed বাংলা/English content", () => {
    render(
      <RescueCaseCard
        {...BASE_PROPS}
        title="ধানমন্ডি ২৭ এর কাছে আহত কুকুর - injured dog near Dhanmondi Lake, gate 4, opposite the pharmacy"
        areaLabel="ধানমন্ডি"
        lastUpdateLabel="১২ মিনিট আগে দেখা গেছে"
      />,
    );
    expect(
      screen.getByText(
        "ধানমন্ডি ২৭ এর কাছে আহত কুকুর - injured dog near Dhanmondi Lake, gate 4, opposite the pharmacy",
      ),
    ).toBeTruthy();
    expect(screen.getByText("ধানমন্ডি")).toBeTruthy();
    expect(screen.getByText("১২ মিনিট আগে দেখা গেছে")).toBeTruthy();
  });
});
