import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

jest.setTimeout(30000);

const mockClose = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockReplace = jest.fn();

function mockChainable(result: { data: unknown; error: unknown }) {
  const node: Record<string, unknown> = {
    select: () => mockChainable(result),
    eq: () => mockChainable(result),
    order: () => mockChainable(result),
    in: () => mockChainable(result),
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return node;
}

jest.mock("../../../../supabase-client", () => ({
  supabase: {
    from: () => mockChainable({ data: [], error: null }),
  },
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "11111111-1111-4111-8111-111111111111" }),
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));

jest.mock("@rescue-alert/api", () => ({
  closeCase: (...args: unknown[]) => mockClose(...args),
  findCaseIdByPublicReference: () =>
    Promise.resolve({ data: null, error: null }),
  getProfileNames: () => Promise.resolve({}),
  listCaseResponses: () => Promise.resolve({ data: [], error: null }),
}));

// eslint-disable-next-line import/first
import CloseCaseScreen from "../close";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

function renderScreen() {
  return render(
    <LocaleProvider storage={memoryStorage}>
      <CloseCaseScreen />
    </LocaleProvider>,
  );
}

describe("CloseCaseScreen", () => {
  it("disables submit until an outcome and a final update are both given", async () => {
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText("Close this case")).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", { name: "Close case" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("calls closeCase and navigates back to the case on submit", async () => {
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText("Close this case")).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByRole("radio", { name: "Successfully rescued" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: "Successfully rescued" }).props
          .accessibilityState.checked,
      ).toBe(true),
    );
    fireEvent.changeText(
      screen.getByLabelText("Final update"),
      "All done, animal is safe.",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Close case" }).props
          .accessibilityState.disabled,
      ).toBe(false),
    );
    fireEvent.press(screen.getByRole("button", { name: "Close case" }));

    await waitFor(() => expect(mockClose).toHaveBeenCalled());
    expect(mockClose.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        caseId: "11111111-1111-4111-8111-111111111111",
        outcome: "successfully_rescued",
        finalUpdate: "All done, animal is safe.",
      }),
    );
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/case/11111111-1111-4111-8111-111111111111",
      ),
    );
  });
});
