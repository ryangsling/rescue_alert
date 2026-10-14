import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
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
} from "@rescue-alert/api";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../supabase-client";

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

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/sign-in");
        return;
      }
      setEmail(data.user.email ?? "");
      const { data: history } = await getUserRescueHistory(
        supabase,
        data.user.id,
      );
      setRescueHistory(history ?? []);
    }
    void loadUser();
  }, [router]);

  async function handleSignOut() {
    setBusy(true);
    await signOutCurrentDevice(supabase);
    setBusy(false);
    router.replace("/sign-in");
  }

  async function handleSignOutAllDevices() {
    setBusy(true);
    await signOutAllDevices(supabase);
    setBusy(false);
    router.replace("/sign-in");
  }

  async function handleDelete() {
    setDeleteError(null);
    setBusy(true);
    const { error } = await requestAccountDeletion(supabase, deletePassword);
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
                <Text className="text-critical">{deleteError}</Text>
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
