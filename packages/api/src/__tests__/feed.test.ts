import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { feedFiltersSchema } from "@rescue-alert/validation";
import { listFeedCases } from "../feed";

describe("listFeedCases", () => {
  it("forwards p_-prefixed args from a fully populated filter set", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    const filters = feedFiltersSchema.parse({
      viewerLocation: { latitude: 23.7461, longitude: 90.3742 },
      radiusMeters: 5000,
      animalTypeIds: ["c9455f13-2062-452c-9deb-be06e4bc0668"],
      incidentTypes: ["injured_animal"],
      searchText: "lake",
      includeClosed: true,
      limit: 10,
      offset: 20,
    });

    await listFeedCases(client, filters);

    expect(rpc).toHaveBeenCalledWith("list_feed_cases", {
      p_viewer_lat: 23.7461,
      p_viewer_lng: 90.3742,
      p_radius_meters: 5000,
      p_animal_type_ids: ["c9455f13-2062-452c-9deb-be06e4bc0668"],
      p_incident_types: ["injured_animal"],
      p_search_text: "lake",
      p_since: undefined,
      p_include_closed: true,
      p_limit: 10,
      p_offset: 20,
    });
  });

  it("forwards undefined viewer lat/lng when no viewer location is given", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await listFeedCases(client, feedFiltersSchema.parse({}));

    const args = rpc.mock.calls[0]![1] as Record<string, unknown>;
    expect(args.p_viewer_lat).toBeUndefined();
    expect(args.p_viewer_lng).toBeUndefined();
    expect(args.p_include_closed).toBe(false);
    expect(args.p_limit).toBe(20);
    expect(args.p_offset).toBe(0);
  });
});
