import { render, screen, waitFor } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

const mockGetUser = jest.fn();
const mockFromResults: Record<string, { data: unknown; error: unknown }> = {};

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

jest.mock("../../supabase-client", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) =>
      mockChainable(mockFromResults[table] ?? { data: [], error: null }),
  },
}));

// eslint-disable-next-line import/first
import FosterProfileScreen from "../foster";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

function renderScreen() {
  return render(
    <LocaleProvider storage={memoryStorage}>
      <FosterProfileScreen />
    </LocaleProvider>,
  );
}

describe("FosterProfileScreen", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFromResults.foster_profiles = { data: null, error: null };
  });

  it("renders the foster profile form for a user with no existing profile", async () => {
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText("My foster profile")).toBeTruthy(),
    );
    expect(screen.getByText("Save foster profile")).toBeTruthy();
  });

  it("shows incoming placement requests for an existing foster profile", async () => {
    mockFromResults.foster_profiles = {
      data: {
        id: "foster-1",
        user_id: "user-1",
        capacity: 2,
        area: "Dhanmondi",
        address: "123 Road",
        available_from: null,
        available_until: null,
        limitations: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    };
    mockFromResults.foster_placement_requests = {
      data: [
        {
          id: "req-1",
          case_id: "case-1",
          foster_profile_id: "foster-1",
          requested_by: "requester-1",
          status: "pending",
          decided_by: null,
          decided_at: null,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    };
    mockFromResults.profiles = { data: [], error: null };

    renderScreen();
    await waitFor(() =>
      expect(screen.getByText("Placement requests")).toBeTruthy(),
    );
    expect(screen.getByText("Approve")).toBeTruthy();
    expect(screen.getByText("Decline")).toBeTruthy();
  });
});
