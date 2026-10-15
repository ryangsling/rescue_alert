import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  Button,
  LoadingState,
  SafeAreaContainer,
  Stack,
  Text,
  TextField,
} from "@rescue-alert/ui";
import {
  getEdgeFunctionErrorCode,
  getUserRescueHistory,
  requestAccountDeletion,
  signOutAllDevices,
  signOutCurrentDevice,
  updateNotificationPreferences,
} from "@rescue-alert/api";
import { updateNotificationPreferencesSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../supabase-client";
import { unregisterPushNotifications } from "../push-notifications";

type RescueHistoryRow =
  Database["public"]["Functions"]["get_user_rescue_history"]["Returns"][number];

const CONTRIBUTION_LABEL_KEY: Record<
  RescueHistoryRow["category"],
  TranslationKey
> = {
  on_site_responder: "contribution_on_site_responder",
  transport_volunteer: "contribution_transport_volunteer",
  foster_provider: "contribution_foster_provider",
  veterinary_support: "contribution_veterinary_support",
  case_coordinator: "contribution_case_coordinator",
  organization_responder: "contribution_organization_responder",
  adoption_facilitator: "contribution_adoption_facilitator",
  moderator_contribution: "contribution_moderator_contribution",
};

export default function AccountScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [rescueHistory, setRescueHistory] = useState<RescueHistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [hasAlertArea, setHasAlertArea] = useState(false);
  const [alertRadiusKm, setAlertRadiusKm] = useState("5");
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [alertAreaStatus, setAlertAreaStatus] = useState<
    "idle" | "locating" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/sign-in");
        return;
      }
      setEmail(data.user.email ?? "");

      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("alert_radius_km, base_location")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (prefs) {
        setHasAlertArea(prefs.base_location !== null);
        setAlertRadiusKm(String(prefs.alert_radius_km));
      }

      const { data: history } = await getUserRescueHistory(
        supabase,
        data.user.id,
      );
      setRescueHistory(history ?? []);
    }
    void loadUser();
  }, [router]);

  async function handleUseCurrentLocationForAlerts() {
    setAlertAreaStatus("locating");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAlertAreaStatus("error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setPendingLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setAlertAreaStatus("idle");
    } catch {
      setAlertAreaStatus("error");
    }
  }

  async function handleSaveAlertArea() {
    if (!pendingLocation) return;
    const result = updateNotificationPreferencesSchema.safeParse({
      baseLocation: pendingLocation,
      alertRadiusKm: Number(alertRadiusKm),
    });
    if (!result.success) {
      setAlertAreaStatus("error");
      return;
    }

    setAlertAreaStatus("saving");
    const { error } = await updateNotificationPreferences(
      supabase,
      result.data,
    );
    if (error) {
      setAlertAreaStatus("error");
      return;
    }
    setHasAlertArea(true);
    setPendingLocation(null);
    setAlertAreaStatus("saved");
  }

  async function handleSignOut() {
    setBusy(true);
    await signOutCurrentDevice(supabase);
    setBusy(false);
    router.replace("/sign-in");
  }

  async function handleSignOutAllDevices() {
    setBusy(true);
    await signOutAllDevices(supabase);
    await unregisterPushNotifications();
    setBusy(false);
    router.replace("/sign-in");
  }

  async function handleDelete() {
    setDeleteError(null);
    setBusy(true);
    const { error } = await requestAccountDeletion(supabase, deletePassword);

    if (!error) await unregisterPushNotifications();
    setBusy(false);

    if (error) {
      const code = await getEdgeFunctionErrorCode(error);
      setDeleteError(
        code === "current_password_incorrect"
          ? t("account_delete_wrong_password")
          : code,
      );
      return;
    }
    router.replace("/sign-in");
  }

  if (email === null) {
    return (
      <SafeAreaContainer>
        <LoadingState />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="6" className="flex-1 p-6">
        <Text variant="heading1">{t("account_settings_heading")}</Text>
        <Text tone="muted">{email}</Text>

        <Stack gap="2">
          <Text variant="titleMedium">{t("rescue_history_heading")}</Text>
          {rescueHistory.length === 0 ? (
            <Text tone="muted">{t("rescue_history_empty")}</Text>
          ) : (
            rescueHistory.map((row) => (
              <Stack
                key={`${row.case_id}-${row.category}`}
                gap="1"
                className="rounded-medium border border-border p-3"
              >
                <Text className="font-semibold">{row.case_title}</Text>
                <Text tone="muted">
                  {t(CONTRIBUTION_LABEL_KEY[row.category])}
                </Text>
                <Text variant="caption" tone="muted">
                  {new Date(row.closed_at).toLocaleDateString(locale)}
                </Text>
              </Stack>
            ))
          )}
        </Stack>

        <Stack gap="2" className="rounded-medium border border-border p-4">
          <Text variant="titleMedium">{t("account_alert_area_heading")}</Text>
          <Text tone="muted" variant="caption">
            {t("account_alert_area_help")}
          </Text>
          <Text>
            {hasAlertArea
              ? t("account_alert_area_set")
              : t("account_alert_area_not_set")}
          </Text>

          <Button
            variant="outline"
            loading={alertAreaStatus === "locating"}
            onPress={handleUseCurrentLocationForAlerts}
          >
            {t("account_alert_area_use_location")}
          </Button>

          <TextField
            label={t("account_alert_radius_label")}
            value={alertRadiusKm}
            onChangeText={setAlertRadiusKm}
            keyboardType="numeric"
          />

          {alertAreaStatus === "error" && (
            <Text accessibilityRole="alert" className="text-critical">
              {t("account_alert_area_error")}
            </Text>
          )}
          {alertAreaStatus === "saved" && (
            <Text className="text-success">
              {t("account_alert_area_saved")}
            </Text>
          )}

          <Button
            variant="primary"
            loading={alertAreaStatus === "saving"}
            disabled={!pendingLocation}
            onPress={handleSaveAlertArea}
          >
            {t("account_alert_area_save")}
          </Button>
        </Stack>

        <Button variant="outline" loading={busy} onPress={handleSignOut}>
          {t("account_sign_out")}
        </Button>
        <Button
          variant="outline"
          loading={busy}
          onPress={handleSignOutAllDevices}
        >
          {t("account_sign_out_all_devices")}
        </Button>

        <Stack gap="3" className="rounded-medium border border-critical p-4">
          <Text className="font-semibold text-critical">
            {t("account_delete_heading")}
          </Text>

          {!confirmingDelete ? (
            <Button
              variant="destructive"
              onPress={() => setConfirmingDelete(true)}
            >
              {t("account_delete_confirm")}
            </Button>
          ) : (
            <Stack gap="3">
              <Text tone="muted">{t("account_delete_warning")}</Text>
              <TextField
                label={t("auth_current_password_label")}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />
              {deleteError && (
                <Text accessibilityRole="alert" className="text-critical">
                  {deleteError}
                </Text>
              )}
              <Button
                variant="destructive"
                loading={busy}
                onPress={handleDelete}
              >
                {t("account_delete_confirm")}
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </SafeAreaContainer>
  );
}
