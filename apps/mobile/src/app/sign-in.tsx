import { useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  Button,
  SafeAreaContainer,
  Stack,
  Text,
  TextField,
} from "@rescue-alert/ui";
import { signIn } from "@rescue-alert/api";
import { signInSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { supabase } from "../supabase-client";

export default function SignInScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      // AUTH-006: same generic message whether the email exists, the
      // password is wrong, or the input is malformed.
      setError(t("auth_sign_in_error"));
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(supabase, result.data);
    setSubmitting(false);

    if (signInError) {
      setError(t("auth_sign_in_error"));
      return;
    }
    router.replace("/");
  }

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text variant="heading1">{t("auth_sign_in_heading")}</Text>

        <TextField
          label={t("auth_email_label")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label={t("auth_password_label")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && (
          <Text accessibilityRole="alert" className="text-critical">
            {error}
          </Text>
        )}

        <Button variant="primary" loading={submitting} onPress={handleSubmit}>
          {t("auth_sign_in_heading")}
        </Button>

        <Link href="/forgot-password">
          <Text className="text-primary">{t("auth_forgot_password_link")}</Text>
        </Link>

        <Stack direction="row" gap="1" justify="center">
          <Text tone="muted">{t("auth_no_account")}</Text>
          <Link href="/register">
            <Text className="text-primary">{t("auth_register_link")}</Text>
          </Link>
        </Stack>
      </Stack>
    </SafeAreaContainer>
  );
}
