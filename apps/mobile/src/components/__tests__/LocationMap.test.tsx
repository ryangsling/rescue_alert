import { fireEvent, render, screen } from "@testing-library/react-native";
import type { LocationMapMarker } from "@rescue-alert/maps";

// @maplibre/maplibre-react-native is a native module with no
// simulator/device available in this environment (this session's
// established mobile limitation) and ships no Jest mock of its own -
// Map/Camera/Marker are stubbed as plain Views so this test proves
// LocationMap's own list/map toggle logic and prop wiring, not
// MapLibre Native rendering, which is untestable here. `View` is
// required inside the factory - jest.mock() factories cannot close
// over outer-scope imports.
jest.mock("@maplibre/maplibre-react-native", () => {
  const { View } = require("react-native");
  return {
    Map: ({ children }: { children?: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Camera: () => null,
    Marker: ({ children }: { children?: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

// eslint-disable-next-line import/first
import { LocationMap } from "../LocationMap";

const MARKERS: LocationMapMarker[] = [
  {
    id: "1",
    type: "critical_case",
    position: { latitude: 23.7461, longitude: 90.3742 },
    label: "Injured dog near Dhanmondi Lake",
  },
];

describe("LocationMap", () => {
  it("shows the list by default", () => {
    render(<LocationMap markers={MARKERS} />);
    expect(screen.getByText("Injured dog near Dhanmondi Lake")).toBeTruthy();
  });

  it("switches to the map view when the Map tab is pressed", () => {
    render(<LocationMap markers={MARKERS} />);
    fireEvent.press(screen.getByRole("button", { name: "Map" }));
    expect(screen.queryByText("Injured dog near Dhanmondi Lake")).toBeNull();
  });
});
