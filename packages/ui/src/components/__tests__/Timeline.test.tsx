import { render, screen } from "@testing-library/react-native";
import { Timeline } from "../Timeline";

describe("Timeline", () => {
  it("renders every update in the given order", () => {
    render(
      <Timeline
        updates={[
          {
            actorName: "Reporter",
            actorRole: "Creator",
            timestampLabel: "10:00",
            updateType: "Report submitted",
            body: "Case opened.",
          },
          {
            actorName: "Responder",
            actorRole: "Volunteer",
            timestampLabel: "10:05",
            updateType: "Status update",
            body: "En route.",
          },
        ]}
      />,
    );
    expect(screen.getByText("Case opened.")).toBeTruthy();
    expect(screen.getByText("En route.")).toBeTruthy();
  });

  it("renders nothing for an empty update list", () => {
    render(<Timeline updates={[]} />);
    expect(screen.queryByText(/./)).toBeNull();
  });
});
