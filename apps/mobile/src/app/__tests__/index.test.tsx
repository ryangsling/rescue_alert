import { View as MockView } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

// This file's first-compile cost is heavier than a typical mobile
// screen test (it pulls in @maplibre/maplibre-react-native's module
// graph even though it's mocked, plus RescueCaseCard/Select/TextField)
// - observed locally taking ~50s for the whole file on this machine,
// well past Jest's default 5000ms per-test timeout. Same root cause
// and fix as report.test.tsx's own jest.setTimeout in this session.
jest.setTimeout(30000);

// @maplibre/maplibre-react-native is a native module with no
// simulator/device available in this environment - see
// src/components/__tests__/LocationMap.test.tsx for the same stub
// and its rationale. The feed screen defaults to list mode, so
// MapCanvas never actually renders here, but the module is still
// imported at load time and must not crash Jest.
jest.mock("@maplibre/maplibre-react-native", () => {
  return {
    Map: ({ children }: { children?: React.ReactNode }) => (
      <MockView>{children}</MockView>
    ),
    Camera: () => null,
    Marker: ({ children }: { children?: React.ReactNode }) => (
      <MockView>{children}</MockView>
    ),
  };
});

const mockAnimalTypesOrder = jest.fn();
const mockFeedRpc = jest.fn();
jest.mock("../../supabase-client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockAnimalTypesOrder(),
        }),
      }),
    }),
    rpc: (...args: unknown[]) => mockFeedRpc(...args),
    // Realtime is not exercised in this Jest environment (no real
    // websocket) - a minimal chainable stub is enough to prove the
    // screen subscribes and unsubscribes without crashing.
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

// eslint-disable-next-line import/first
import Home from "../index";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("Home (nearby feed)", () => {
  beforeEach(() => {
    mockAnimalTypesOrder.mockResolvedValue({ data: [] });
    mockFeedRpc.mockResolvedValue({ data: [], error: null });
  });

  it("shows the feed heading and empty state once loading settles", async () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <Home />
      </LocaleProvider>,
    );

    expect(screen.getByText("Nearby cases")).toBeTruthy();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("No cases match your filters yet.")).toBeTruthy();
    expect(mockFeedRpc).toHaveBeenCalledWith(
      "list_feed_cases",
      expect.objectContaining({
        p_include_closed: false,
        p_limit: 20,
        p_offset: 0,
      }),
    );
  });

  it("renders a returned case's title", async () => {
    mockFeedRpc.mockResolvedValue({
      data: [
        {
          id: "1",
          public_reference: "REF-1",
          incident_type: "injured_animal",
          animal_type_slug: "dog",
          urgency: "critical",
          status: "open",
          title: "Injured dog near the market",
          division: "Dhaka",
          district: "Dhaka",
          upazila_or_thana: "Dhanmondi",
          approximate_latitude: 23.75,
          approximate_longitude: 90.39,
          reported_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          distance_meters: null,
          priority_tier: 4,
          thumbnail_storage_path: null,
          thumbnail_is_graphic: null,
          total_count: 1,
        },
      ],
      error: null,
    });

    render(
      <LocaleProvider storage={memoryStorage}>
        <Home />
      </LocaleProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Injured dog near the market")).toBeTruthy();
  });
});
