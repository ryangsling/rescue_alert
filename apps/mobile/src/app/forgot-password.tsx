import { useState } from "react";
import {
  Button,
  SafeAreaContainer,
  Stack,
  Text,
  TextField,
} from "@rescue-alert/ui";
import { requestPasswordReset } from "@rescue-alert/api";
import { passwordResetRequestSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { supabase } from "../supabase-client";

export default function ForgotPasswordScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit() {
    const result = passwordResetRequestSchema.safeParse({ email });
    if (!result.success) return;

    setSubmitting(true);
    // AUTH-006: no branch on whether the account exists.
    await requestPasswordReset(
      supabase,
      result.data.email,
      "rescuealert://auth-callback?next=/reset-password",
    );
    setSubmitting(false);
    setSentTo(result.data.email);
  }

  if (sentTo) {
    return (
      <SafeAreaContainer>
        <Stack align="center" justify="center" gap="4" className="flex-1 p-8">
          <Text variant="heading1">{t("auth_forgot_password_heading")}</Text>
          <Text tone="muted">
            {t("auth_forgot_password_success", { email: sentTo })}
          </Text>
        </Stack>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text variant="heading1">{t("auth_forgot_password_heading")}</Text>
        <Text tone="muted">{t("auth_forgot_password_instructions")}</Text>

        <TextField
          label={t("auth_email_label")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button variant="primary" loading={submitting} onPress={handleSubmit}>
          {t("auth_forgot_password_submit")}
        </Button>
      </Stack>
    </SafeAreaContainer>
  );
}
