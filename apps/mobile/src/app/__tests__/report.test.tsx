import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import type { CaseDraft } from "@rescue-alert/drafts";

const mockOrder = jest.fn();
jest.mock("../../supabase-client", () => ({
  supabase: {
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockOrder(),
        }),
      }),
    }),
  },
}));

let mockSavedDraft: CaseDraft | null = null;
jest.mock("../../draft-store", () => ({
  draftStore: {
    list: () => Promise.resolve(mockSavedDraft ? [mockSavedDraft] : []),
    save: (draft: CaseDraft) => {
      mockSavedDraft = draft;
      return Promise.resolve();
    },
    get: () => Promise.resolve(null),
    delete: () => Promise.resolve(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Imported after the mocks above so the module under test picks them
// up (jest.mock calls are hoisted by babel-jest regardless of source
// position, but the eslint import/first rule doesn't know that).
// eslint-disable-next-line import/first
import ReportScreen from "../report";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

function renderScreen() {
  return render(
    <LocaleProvider storage={memoryStorage}>
      <ReportScreen />
    </LocaleProvider>,
  );
}

describe("ReportScreen", () => {
  beforeEach(() => {
    mockSavedDraft = null;
    mockOrder.mockResolvedValue({ data: [] });
  });

  it("shows the incident type step first", async () => {
    renderScreen();
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("What happened?")).toBeTruthy();
    expect(screen.getByText("Injured animal")).toBeTruthy();
  });

  it("advances to the photo step once incident type and urgency are chosen", async () => {
    renderScreen();
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByRole("radio", { name: "Injured animal" }));
    fireEvent.press(screen.getByRole("radio", { name: "Critical" }));
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Add a photo")).toBeTruthy();
  });
});
