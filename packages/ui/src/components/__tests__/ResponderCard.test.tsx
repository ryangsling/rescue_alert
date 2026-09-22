import { render, screen, fireEvent } from "@testing-library/react-native";
import { ResponderCard } from "../ResponderCard";

const BASE_PROPS = {
  name: "Farhan Rahman",
  assistanceTypeLabel: "On-site rescue, Transport",
  statusLabel: "Confirmed",
  statusTone: "support" as const,
};

describe("ResponderCard", () => {
  it("renders identity, assistance type, and status", () => {
    render(<ResponderCard {...BASE_PROPS} />);
    expect(screen.getByText("Farhan Rahman")).toBeTruthy();
    expect(screen.getByText("On-site rescue, Transport")).toBeTruthy();
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });

  // DESIGN.md section 11.8 + Part 5 test requirement: phone numbers
  // must not appear without authorization.
  it("omits the phone number for an unauthorized viewer, even if one is provided", () => {
    render(
      <ResponderCard
        {...BASE_PROPS}
        phoneNumber="+8801711111111"
        isAuthorizedViewer={false}
      />,
    );
    expect(screen.queryByText("+8801711111111")).toBeNull();
  });

  it("omits the phone number by default (isAuthorizedViewer defaults to false)", () => {
    render(<ResponderCard {...BASE_PROPS} phoneNumber="+8801711111111" />);
    expect(screen.queryByText("+8801711111111")).toBeNull();
  });

  it("shows the phone number only for an authorized viewer", () => {
    render(
      <ResponderCard
        {...BASE_PROPS}
        phoneNumber="+8801711111111"
        isAuthorizedViewer
      />,
    );
    expect(screen.getByText("+8801711111111")).toBeTruthy();
  });

  it("shows verification state when verified", () => {
    render(
      <ResponderCard
        {...BASE_PROPS}
        isVerified
        verifiedByLabel="Verified by moderator"
      />,
    );
    expect(screen.getByText("Verified by moderator")).toBeTruthy();
  });

  it("renders coordinator actions and fires their handlers independently", () => {
    const onConfirm = jest.fn();
    const onDecline = jest.fn();
    render(
      <ResponderCard
        {...BASE_PROPS}
        coordinatorActions={[
          { label: "Confirm", onPress: onConfirm },
          { label: "Decline", onPress: onDecline },
        ]}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });
});
