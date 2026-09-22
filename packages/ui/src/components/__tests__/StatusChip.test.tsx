import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { StatusChip, type StatusChipTone } from "../StatusChip";

describe("StatusChip", () => {
  it("renders the label", () => {
    render(<StatusChip tone="critical" label="Critical" />);
    expect(screen.getByText("Critical")).toBeTruthy();
  });

  // design/DESIGN.md section 5.4 + Part 5 test requirement: status is
  // never conveyed by color alone. Every tone must render both an
  // icon element and the text label together.
  it.each<StatusChipTone>([
    "critical",
    "urgent",
    "support",
    "success",
    "warning",
    "neutral",
  ])(
    "tone %s renders both an icon (SVG) and the text label, not color alone",
    (tone) => {
      render(<StatusChip tone={tone} label="Status" />);
      expect(screen.getByText("Status")).toBeTruthy();
      // Lucide icons render as an RNSVGSvgView host node - checking
      // for it directly rather than guessing at RNTL's parent/child
      // traversal across composite component boundaries (proven
      // unreliable for that earlier in this file: text.parent did
      // not point to the host-level container despite the actual
      // tree, printed via screen.debug(), showing icon and text as
      // direct View children).
      expect(
        screen.UNSAFE_getAllByType("RNSVGSvgView" as never).length,
      ).toBeGreaterThan(0);
    },
  );

  it("accepts a custom icon override", () => {
    render(
      <StatusChip
        tone="support"
        label="Custom"
        icon={<Text testID="custom-icon">*</Text>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeTruthy();
  });
});
