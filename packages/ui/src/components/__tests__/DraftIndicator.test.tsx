import { render, screen } from "@testing-library/react-native";
import { DraftIndicator, type DraftState } from "../DraftIndicator";

describe("DraftIndicator", () => {
  it.each<[DraftState, string]>([
    ["pending", "Saved on this device"],
    ["syncing", "Syncing"],
    ["synced", "Synced"],
    ["failed", "Could not send. Saved on this device."],
  ])("state %s shows its own distinct label", (state, expectedText) => {
    render(<DraftIndicator state={state} />);
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  // OFF-006 / Part 5 test requirement: distinguishes pending local
  // state from confirmed server state - not just different text, a
  // different tone too (never color alone, but tone still differs).
  it("uses a different className between pending and synced", () => {
    const { unmount } = render(<DraftIndicator state="pending" />);
    const pendingText = screen.getByText("Saved on this device").props
      .className;
    unmount();
    render(<DraftIndicator state="synced" />);
    const syncedText = screen.getByText("Synced").props.className;
    expect(pendingText).not.toBe(syncedText);
  });
});
