import { render, screen, fireEvent } from "@testing-library/react-native";
import { LocationField } from "../LocationField";

describe("LocationField", () => {
  it("shows a placeholder when no location has been set", () => {
    render(
      <LocationField
        landmark=""
        onLandmarkChange={() => {}}
        onUseGps={() => {}}
        onAdjustOnMap={() => {}}
      />,
    );
    expect(screen.getByText("No location set yet")).toBeTruthy();
  });

  it("shows the map preview image when one is given", () => {
    render(
      <LocationField
        mapPreviewUri="https://example.test/map.png"
        landmark=""
        onLandmarkChange={() => {}}
        onUseGps={() => {}}
        onAdjustOnMap={() => {}}
      />,
    );
    expect(screen.queryByText("No location set yet")).toBeNull();
    expect(
      screen.getByLabelText("Map preview of the selected location"),
    ).toBeTruthy();
  });

  it("calls onUseGps and onAdjustOnMap independently", () => {
    const onUseGps = jest.fn();
    const onAdjustOnMap = jest.fn();
    render(
      <LocationField
        landmark=""
        onLandmarkChange={() => {}}
        onUseGps={onUseGps}
        onAdjustOnMap={onAdjustOnMap}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Use my location" }));
    expect(onUseGps).toHaveBeenCalledTimes(1);
    expect(onAdjustOnMap).not.toHaveBeenCalled();
  });

  // manual entry (PERM-005/CASE-006) must work independently of GPS/map.
  it("calls onLandmarkChange as the user types, with no dependency on GPS", () => {
    const onLandmarkChange = jest.fn();
    render(
      <LocationField
        landmark=""
        onLandmarkChange={onLandmarkChange}
        onUseGps={() => {}}
        onAdjustOnMap={() => {}}
      />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Landmark"),
      "Near Dhanmondi Lake, gate 4",
    );
    expect(onLandmarkChange).toHaveBeenCalledWith(
      "Near Dhanmondi Lake, gate 4",
    );
  });
});
