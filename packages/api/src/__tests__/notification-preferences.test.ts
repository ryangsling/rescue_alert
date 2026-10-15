import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  registerDevice,
  unregisterDevice,
  updateNotificationPreferences,
} from "../notification-preferences";

describe("updateNotificationPreferences", () => {
  it("builds WKT from lat/lng and calls update_my_notification_preferences", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await updateNotificationPreferences(client, {
      baseLocation: { latitude: 23.75, longitude: 90.39 },
      alertRadiusKm: 5,
    });

    expect(rpc).toHaveBeenCalledWith("update_my_notification_preferences", {
      p_base_location: "SRID=4326;POINT(90.39 23.75)",
      p_alert_radius_km: 5,
    });
  });
});

describe("registerDevice", () => {
  it("calls register_device with the p_-prefixed argument names it expects", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await registerDevice(client, {
      expoPushToken: "ExponentPushToken[abc]",
      platform: "android",
    });

    expect(rpc).toHaveBeenCalledWith("register_device", {
      p_expo_push_token: "ExponentPushToken[abc]",
      p_platform: "android",
    });
  });
});

describe("unregisterDevice", () => {
  it("calls unregister_device with the token", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await unregisterDevice(client, "ExponentPushToken[abc]");

    expect(rpc).toHaveBeenCalledWith("unregister_device", {
      p_expo_push_token: "ExponentPushToken[abc]",
    });
  });
});
