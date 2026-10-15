import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerDevice, unregisterDevice } from "@rescue-alert/api";
import { supabase } from "./supabase-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// The Expo push token does not change within an install, so it is kept
// here to retire it on sign-out without a fresh permission prompt.
let lastExpoPushToken: string | null = null;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Part 11 follow-up (ALERT-003 through ALERT-011 were server-only
 * until now): requests permission and registers this device's Expo
 * push token for the signed-in user via register_device(). A denied
 * permission or a simulator with no push capability is a silent
 * no-op, not an error - PERM-005 means the rest of the app must keep
 * working with no push at all.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;
  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  lastExpoPushToken = expoPushToken;

  await registerDevice(supabase, {
    expoPushToken,
    platform: Platform.OS === "ios" ? "ios" : "android",
  });
}

/** Retires this device's token (best-effort - sign-out proceeds either way). */
export async function unregisterPushNotifications(): Promise<void> {
  if (!lastExpoPushToken) return;
  const token = lastExpoPushToken;
  lastExpoPushToken = null;
  await unregisterDevice(supabase, token);
}

/**
 * Registers on launch when a session already exists, and on every
 * subsequent sign-in; unregisters on sign-out. One listener here
 * covers sign-in, sign-up, and relaunch instead of repeating the call
 * at every screen that can start or end a session.
 */
export function usePushRegistration(): void {
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void registerForPushNotifications();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void registerForPushNotifications();
      if (event === "SIGNED_OUT") void unregisterPushNotifications();
    });
    return () => subscription.subscription.unsubscribe();
  }, []);
}

/**
 * Deep link data (Part 11's buildPushMessage): opens the case from a
 * notification tap, both while running and from a cold start.
 */
export function useNotificationNavigation(): void {
  const router = useRouter();

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
      const caseId = response.notification.request.content.data?.caseId as
        string | undefined;
      if (caseId) router.push(`/case/${caseId}`);
    }

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [router]);
}
