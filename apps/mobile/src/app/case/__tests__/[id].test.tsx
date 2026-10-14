import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

jest.setTimeout(30000);

/**
 * supabase-js's query builder is a thenable at every step, not just
 * at a fixed "terminal" method - .select().eq().order() can be
 * awaited directly without a final .then() call. This mirrors that:
 * every chain method returns another chainable resolving to the same
 * result, so the mock doesn't need to know exactly how many
 * .eq()/.order() calls a given packages/api function makes.
 */
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

const mockGetUser = jest.fn();
const mockRpc = jest.fn();
const mockFromResults: Record<string, { data: unknown; error: unknown }> = {};

jest.mock("../../../supabase-client", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) =>
      mockChainable(mockFromResults[table] ?? { data: [], error: null }),
    channel: () => ({
      on: function on() {
        return this;
      },
      subscribe: function subscribe() {
        return this;
      },
    }),
    removeChannel: () => Promise.resolve("ok"),
  },
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "case-1" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// eslint-disable-next-line import/first
import CaseDetailScreen from "../[id]";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

function renderScreen() {
  return render(
    <LocaleProvider storage={memoryStorage}>
      <CaseDetailScreen />
    </LocaleProvider>,
  );
}

describe("CaseDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockRpc.mockResolvedValue({ data: false, error: null });

    mockFromResults.rescue_cases = {
      data: {
        id: "case-1",
        title: "Injured dog near the market",
        description: "Limping on its front leg",
        status: "open",
        urgency: "urgent",
        creator_id: "creator-1",
        coordinator_id: null,
        upazila_or_thana: "Dhanmondi",
        district: "Dhaka",
        updated_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    };
    mockFromResults.case_responses = { data: [], error: null };
    mockFromResults.case_needs = { data: [], error: null };
    mockFromResults.case_comments = { data: [], error: null };
    mockFromResults.case_updates = { data: [], error: null };
    mockFromResults.profiles = { data: [], error: null };
    mockFromResults.case_watchers = { data: null, error: null };
  });

  it("loads the case and renders its title and the 'I can help' action", async () => {
    renderScreen();

    expect(
      await screen.findByText(
        "Injured dog near the market",
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.getByText("Limping on its front leg")).toBeTruthy();
    expect(screen.getByText("I can help")).toBeTruthy();
  });

  it("shows a closed notice instead of the response form when the case is closed", async () => {
    mockFromResults.rescue_cases = {
      data: {
        ...(mockFromResults.rescue_cases.data as object),
        status: "closed",
      },
      error: null,
    };
    renderScreen();

    expect(
      await screen.findByText(
        "Injured dog near the market",
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.getByText("This case has been closed.")).toBeTruthy();
    expect(screen.queryByText("I can help")).toBeNull();
  });

  it("shows a not-found state when the case does not exist", async () => {
    mockFromResults.rescue_cases = { data: null, error: null };
    renderScreen();

    expect(
      await screen.findByText("Case not found", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});
