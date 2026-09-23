import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

const mockOrder = jest.fn();
jest.mock("../../supabase-client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockOrder(),
        }),
      }),
    }),
  },
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Imported after the mocks above so the module under test picks them
// up (jest.mock calls are hoisted by babel-jest regardless of source
// position, but the eslint import/first rule doesn't know that).
// eslint-disable-next-line import/first
import OnboardingScreen from "../onboarding";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("OnboardingScreen", () => {
  it("shows the capabilities step first", async () => {
    mockOrder.mockResolvedValue({ data: [] });

    render(
      <LocaleProvider storage={memoryStorage}>
        <OnboardingScreen />
      </LocaleProvider>,
    );

    expect(screen.getByText("How would you like to help?")).toBeTruthy();
    expect(screen.getByText("On-site rescue")).toBeTruthy();

    // The animal-types fetch still kicks off on mount even though
    // step 1 doesn't show it; flush it inside act() so its state
    // update doesn't leak past this test's render.
    await act(async () => {
      await mockOrder.mock.results[0]?.value;
    });
  });

  it("shows real animal types on step 2 once loaded", async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: "1", slug: "dog", label_en: "Dog", label_bn: "কুকুর" }],
    });

    render(
      <LocaleProvider storage={memoryStorage}>
        <OnboardingScreen />
      </LocaleProvider>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByText("Dog")).toBeTruthy());
  });
});
