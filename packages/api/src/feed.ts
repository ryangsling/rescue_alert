import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type { FeedFiltersInput } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

export type FeedCase =
  Database["public"]["Functions"]["list_feed_cases"]["Returns"][number];

/** Part 10 nearby feed. See list_feed_cases() (Part 10 DB layer) for the five-tier ranking, filter, search, and pagination contract. */
export async function listFeedCases(client: Client, filters: FeedFiltersInput) {
  return client.rpc("list_feed_cases", {
    p_viewer_lat: filters.viewerLocation?.latitude,
    p_viewer_lng: filters.viewerLocation?.longitude,
    p_radius_meters: filters.radiusMeters,
    p_animal_type_ids: filters.animalTypeIds,
    p_incident_types: filters.incidentTypes,
    p_search_text: filters.searchText,
    p_since: filters.since,
    p_include_closed: filters.includeClosed,
    p_limit: filters.limit,
    p_offset: filters.offset,
  });
}
