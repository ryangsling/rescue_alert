import { render, screen, waitFor } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

const mockGetUser = jest.fn();
jest.mock("../../supabase-client", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
  },
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Imported after the mocks above so the module under test picks them
// up (jest.mock calls are hoisted by babel-jest regardless of source
// position, but the eslint import/first rule doesn't know that).
// eslint-disable-next-line import/first
import AccountScreen from "../account";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("AccountScreen", () => {
  it("shows the signed-in user's email once loaded", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
    });

    render(
      <LocaleProvider storage={memoryStorage}>
        <AccountScreen />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("test@example.com")).toBeTruthy(),
    );
    expect(screen.getByText("Account")).toBeTruthy();
  });
});
