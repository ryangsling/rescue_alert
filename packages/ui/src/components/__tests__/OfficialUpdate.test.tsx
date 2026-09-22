import { render, screen } from "@testing-library/react-native";
import { OfficialUpdate } from "../OfficialUpdate";

describe("OfficialUpdate", () => {
  it("renders actor identity, role, update type, body, and timestamp", () => {
    render(
      <OfficialUpdate
        actorName="Nusrat Jahan"
        actorRole="Coordinator"
        timestampLabel="2 minutes ago"
        updateType="Status update"
        body="Responder is 5 minutes away."
      />,
    );
    expect(screen.getByText("Nusrat Jahan")).toBeTruthy();
    expect(screen.getByText("Coordinator")).toBeTruthy();
    expect(screen.getByText("Status update")).toBeTruthy();
    expect(screen.getByText("Responder is 5 minutes away.")).toBeTruthy();
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
  });

  // COMM-003: must remain visually distinct from ordinary comments -
  // checked via the left-accent class that a plain comment does not have.
  it("carries the left semantic accent class that distinguishes it from a comment", () => {
    render(
      <OfficialUpdate
        actorName="A"
        actorRole="Moderator"
        timestampLabel="now"
        updateType="Notice"
        body="Text"
      />,
    );
    expect(
      screen.getByTestId("official-update-accent").props.className,
    ).toContain("border-l-4");
  });

  it("shows no pinned label by default", () => {
    render(
      <OfficialUpdate
        actorName="A"
        actorRole="Moderator"
        timestampLabel="now"
        updateType="Notice"
        body="Text"
      />,
    );
    expect(screen.queryByText("Pinned")).toBeNull();
  });

  it("shows a pinned label when isPinned is true", () => {
    render(
      <OfficialUpdate
        actorName="A"
        actorRole="Moderator"
        timestampLabel="now"
        updateType="Notice"
        body="Text"
        isPinned
      />,
    );
    expect(screen.getByText("Pinned")).toBeTruthy();
  });
});
