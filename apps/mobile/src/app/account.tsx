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
  requestAccountDeletion,
  signOutAllDevices,
  signOutCurrentDevice,
} from "@rescue-alert/api";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { supabase } from "../supabase-client";

export default function AccountScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
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
