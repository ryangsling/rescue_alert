import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@rescue-alert/types";
import type { AnalyticsEventName } from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/** PRD section 23. Fire-and-forget by convention at call sites - a failed analytics write must never block or roll back the real action it describes. */
export async function recordAnalyticsEvent(
  client: Client,
  eventName: AnalyticsEventName,
  properties?: Record<string, Json>,
) {
  return client.rpc("record_analytics_event", {
    p_event_name: eventName,
    p_properties: properties ?? {},
  });
}

/** Part 20. Moderator/administrator only - returns no row for anyone else, see get_operational_dashboard_signals(). */
export async function getOperationalDashboardSignals(client: Client) {
  return client.rpc("get_operational_dashboard_signals");
}
