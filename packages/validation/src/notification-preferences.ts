import { z } from "zod";
import { caseLocationSchema } from "./case";

/** PERM-005/ALERT-002: a static, user-chosen base point and radius for nearby alerts - never a tracked location. */
export const updateNotificationPreferencesSchema = z.object({
  baseLocation: caseLocationSchema,
  alertRadiusKm: z.number().positive(),
});
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

/** Matches the server-side format check in register_device() (Part 11). */
export const expoPushTokenSchema = z
  .string()
  .regex(/^(Expo|Exponent)PushToken\[.+\]$/, "invalid push token");

export const devicePlatformSchema = z.enum(["ios", "android"]);

export const registerDeviceSchema = z.object({
  expoPushToken: expoPushTokenSchema,
  platform: devicePlatformSchema,
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
