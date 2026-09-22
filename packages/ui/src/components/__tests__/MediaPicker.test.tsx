import { render, screen, fireEvent } from "@testing-library/react-native";
import { MediaPicker, type MediaItem } from "../MediaPicker";

const UPLOADING: MediaItem = {
  id: "1",
  uri: "https://example.test/a.jpg",
  state: "uploading",
};
const UPLOADED: MediaItem = {
  id: "2",
  uri: "https://example.test/b.jpg",
  state: "uploaded",
};
const FAILED: MediaItem = {
  id: "3",
  uri: "https://example.test/c.jpg",
  state: "failed",
};

describe("MediaPicker", () => {
  it("shows the add-photo control when there are no items", () => {
    render(
      <MediaPicker
        items={[]}
        onAdd={() => {}}
        onRetry={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Add photo" })).toBeTruthy();
  });

  it("calls onAdd when the add control is pressed", () => {
    const onAdd = jest.fn();
    render(
      <MediaPicker
        items={[]}
        onAdd={onAdd}
        onRetry={() => {}}
        onRemove={() => {}}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Add photo" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("shows an uploading indicator for an uploading item", () => {
    render(
      <MediaPicker
        items={[UPLOADING]}
        onAdd={() => {}}
        onRetry={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByLabelText("Uploading")).toBeTruthy();
  });

  it("shows a retry control for a failed item and calls onRetry with its id", () => {
    const onRetry = jest.fn();
    render(
      <MediaPicker
        items={[FAILED]}
        onAdd={() => {}}
        onRetry={onRetry}
        onRemove={() => {}}
      />,
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Upload failed. Tap to retry." }),
    );
    expect(onRetry).toHaveBeenCalledWith("3");
  });

  it("shows no retry or uploading overlay for an uploaded item", () => {
    render(
      <MediaPicker
        items={[UPLOADED]}
        onAdd={() => {}}
        onRetry={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Uploading")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Upload failed. Tap to retry." }),
    ).toBeNull();
  });

  it("calls onRemove with the item's id", () => {
    const onRemove = jest.fn();
    render(
      <MediaPicker
        items={[UPLOADED]}
        onAdd={() => {}}
        onRetry={() => {}}
        onRemove={onRemove}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Remove photo" }));
    expect(onRemove).toHaveBeenCalledWith("2");
  });

  it("hides the add control once maxItems is reached", () => {
    render(
      <MediaPicker
        items={[UPLOADED]}
        onAdd={() => {}}
        onRetry={() => {}}
        onRemove={() => {}}
        maxItems={1}
      />,
    );
    expect(screen.queryByRole("button", { name: "Add photo" })).toBeNull();
  });
});
