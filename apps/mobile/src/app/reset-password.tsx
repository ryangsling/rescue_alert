import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Button,
  SafeAreaContainer,
  Stack,
  Text,
  TextField,
} from "@rescue-alert/ui";
import { confirmPasswordReset } from "@rescue-alert/api";
import { passwordResetConfirmSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { supabase } from "../supabase-client";

/**
 * Reached via auth-callback.tsx after a recovery deep link, which
 * already establishes a recovery session - this screen's only job is
 * updateUser({ password }) against that session.
 */
export default function ResetPasswordScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError(null);

    const result = passwordResetConfirmSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("form_required_field"));
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await confirmPasswordReset(
      supabase,
      result.data.password,
    );
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/"), 1500);
  }

  if (done) {
    return (
      <SafeAreaContainer>
        <Stack align="center" justify="center" className="flex-1 p-8">
          <Text>{t("auth_reset_password_success")}</Text>
        </Stack>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text variant="heading1">{t("auth_reset_password_heading")}</Text>

        <TextField
          label={t("auth_password_label")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextField
          label={t("auth_confirm_password_label")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error && (
          <Text accessibilityRole="alert" className="text-critical">
            {error}
          </Text>
        )}

        <Button variant="primary" loading={submitting} onPress={handleSubmit}>
          {t("auth_reset_password_submit")}
        </Button>
      </Stack>
    </SafeAreaContainer>
  );
}
