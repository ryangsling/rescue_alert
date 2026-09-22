import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { darkColors, lightColors } from "@rescue-alert/design-tokens";
import { ThemeProvider } from "../ThemeProvider";

const mockUseColorScheme = jest.fn();
jest.mock("nativewind", () => {
  const actual = jest.requireActual("nativewind");
  return {
    ...actual,
    useColorScheme: () => mockUseColorScheme(),
  };
});

/**
 * NativeWind's vars() return value is not a plain, inspectable object
 * in the Jest/RN test renderer environment (its data lives behind
 * non-enumerable internal storage - proven directly: JSON.stringify
 * and Object.keys both show {} / [] for a vars() result here), so
 * these tests can only verify ThemeProvider picks up the color scheme
 * and renders its children without throwing for both values - not the
 * literal resolved CSS variable output. That's verified at the build
 * level instead: an actual `expo export --platform web` was run and
 * the compiled CSS was inspected directly, confirming classes like
 * `.bg-primary{background-color:var(--rescue-primary)}` and the
 * exported HTML setting --rescue-primary to lightColors.primary, with both
 * the light and dark hex values present in the JS bundle.
 */
describe("ThemeProvider", () => {
  it("renders children under the light color scheme", () => {
    mockUseColorScheme.mockReturnValue({ colorScheme: "light" });
    render(
      <ThemeProvider>
        <Text>content</Text>
      </ThemeProvider>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("renders children under the dark color scheme", () => {
    mockUseColorScheme.mockReturnValue({ colorScheme: "dark" });
    render(
      <ThemeProvider>
        <Text>content</Text>
      </ThemeProvider>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("defines genuinely different values between the two themes it switches between", () => {
    expect(lightColors.primary).not.toBe(darkColors.primary);
    expect(lightColors.background).not.toBe(darkColors.background);
    expect(lightColors.text).not.toBe(darkColors.text);
  });
});
