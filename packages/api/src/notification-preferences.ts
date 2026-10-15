import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  RegisterDeviceInput,
  UpdateNotificationPreferencesInput,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

/** PostGIS accepts WKT text for a geography column over PostgREST (same convention as packages/api/src/case.ts). */
function toWkt(
  location: UpdateNotificationPreferencesInput["baseLocation"],
): string {
  return `SRID=4326;POINT(${location.longitude} ${location.latitude})`;
}

/**
 * ALERT-002/PERM-005: a volunteer's static base point for nearby
 * alerts, via update_my_notification_preferences() (Part 11
 * follow-up) so the client never constructs a `geography` literal
 * itself.
 */
export async function updateNotificationPreferences(
  client: Client,
  input: UpdateNotificationPreferencesInput,
) {
  return client.rpc("update_my_notification_preferences", {
    p_base_location: toWkt(input.baseLocation),
    p_alert_radius_km: input.alertRadiusKm,
  });
}

/** Part 11: moves a token between accounts safely on the server, see register_device(). */
export async function registerDevice(
  client: Client,
  input: RegisterDeviceInput,
) {
  return client.rpc("register_device", {
    p_expo_push_token: input.expoPushToken,
    p_platform: input.platform,
  });
}

export async function unregisterDevice(client: Client, expoPushToken: string) {
  return client.rpc("unregister_device", {
    p_expo_push_token: expoPushToken,
  });
}
