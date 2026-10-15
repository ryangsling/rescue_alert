import { describe, expect, it } from "vitest";
import {
  devicePlatformSchema,
  expoPushTokenSchema,
  registerDeviceSchema,
  updateNotificationPreferencesSchema,
} from "../notification-preferences";

describe("updateNotificationPreferencesSchema", () => {
  it("accepts a valid point and radius", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      baseLocation: { latitude: 23.75, longitude: 90.39 },
      alertRadiusKm: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive radius", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      baseLocation: { latitude: 23.75, longitude: 90.39 },
      alertRadiusKm: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range latitude", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      baseLocation: { latitude: 190, longitude: 90.39 },
      alertRadiusKm: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("expoPushTokenSchema", () => {
  it("accepts a well-formed Expo push token", () => {
    expect(
      expoPushTokenSchema.safeParse("ExponentPushToken[abc123]").success,
    ).toBe(true);
  });

  it("rejects a malformed token", () => {
    expect(expoPushTokenSchema.safeParse("not-a-token").success).toBe(false);
  });
});

describe("devicePlatformSchema", () => {
  it("accepts ios and android", () => {
    expect(devicePlatformSchema.safeParse("ios").success).toBe(true);
    expect(devicePlatformSchema.safeParse("android").success).toBe(true);
  });

  it("rejects an unknown platform", () => {
    expect(devicePlatformSchema.safeParse("web").success).toBe(false);
  });
});

describe("registerDeviceSchema", () => {
  it("accepts a valid token and platform", () => {
    const result = registerDeviceSchema.safeParse({
      expoPushToken: "ExponentPushToken[abc123]",
      platform: "android",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed token even with a valid platform", () => {
    const result = registerDeviceSchema.safeParse({
      expoPushToken: "garbage",
      platform: "android",
    });
    expect(result.success).toBe(false);
  });
});
