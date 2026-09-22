import { render, screen } from "@testing-library/react-native";
import { typeScale } from "@rescue-alert/design-tokens";
import { Text } from "../Text";

describe("Text", () => {
  it("renders its content", () => {
    render(<Text>Animal last seen 12 minutes ago</Text>);
    expect(screen.getByText("Animal last seen 12 minutes ago")).toBeTruthy();
  });

  it("defaults to the bodyLarge type scale step", () => {
    render(<Text>Body copy</Text>);
    const style = screen.getByText("Body copy").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.fontSize).toBe(typeScale.bodyLarge.fontSize);
    expect(flat.lineHeight).toBe(typeScale.bodyLarge.lineHeight);
  });

  it("applies the requested variant's type scale", () => {
    render(<Text variant="heading1">Screen title</Text>);
    const style = screen.getByText("Screen title").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.fontSize).toBe(typeScale.heading1.fontSize);
    expect(flat.fontWeight).toBe(typeScale.heading1.fontWeight);
  });

  it("applies the muted tone class when requested", () => {
    render(<Text tone="muted">Secondary content</Text>);
    expect(screen.getByText("Secondary content").props.className).toContain(
      "text-text-muted",
    );
  });
});
