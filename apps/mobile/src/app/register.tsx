import { useState } from "react";
import { Link } from "expo-router";
import {
  Button,
  Checkbox,
  SafeAreaContainer,
  Stack,
  Text,
  TextField,
} from "@rescue-alert/ui";
import { registerUser } from "@rescue-alert/api";
import { registrationSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { supabase } from "../supabase-client";

type FieldErrors = Partial<Record<string, string>>;

export default function RegisterScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);
  const [locationPolicyAccepted, setLocationPolicyAccepted] = useState(false);
  const [communityRulesAccepted, setCommunityRulesAccepted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitError(null);

    const result = registrationSchema.safeParse({
      fullName,
      email,
      phone,
      city: city || undefined,
      area: area || undefined,
      preferredLanguage: locale,
      password,
      confirmPassword,
      termsAccepted,
      privacyNoticeAccepted,
      locationPolicyAccepted,
      communityRulesAccepted,
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const { error } = await registerUser(supabase, result.data, {
      emailRedirectTo: "rescuealert://auth-callback?next=/",
    });
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    setRegisteredEmail(result.data.email);
  }

  if (registeredEmail) {
    return (
      <SafeAreaContainer>
        <Stack align="center" justify="center" gap="4" className="flex-1 p-8">
          <Text variant="heading1">{t("auth_register_success_heading")}</Text>
          <Text tone="muted">
            {t("auth_register_success_message", { email: registeredEmail })}
          </Text>
          <Link href="/sign-in">
            <Text className="text-primary">{t("auth_sign_in_link")}</Text>
          </Link>
        </Stack>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text variant="heading1">{t("auth_register_heading")}</Text>

        <TextField
          label={t("auth_full_name_label")}
          value={fullName}
          onChangeText={setFullName}
          errorText={fieldErrors.fullName}
        />
        <TextField
          label={t("auth_email_label")}
          value={email}
          onChangeText={setEmail}
          errorText={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label={t("auth_phone_label")}
          value={phone}
          onChangeText={setPhone}
          errorText={fieldErrors.phone}
          phoneField
        />
        <TextField
          label={t("auth_city_label")}
          value={city}
          onChangeText={setCity}
        />
        <TextField
          label={t("auth_area_label")}
          value={area}
          onChangeText={setArea}
        />
        <TextField
          label={t("auth_password_label")}
          value={password}
          onChangeText={setPassword}
          errorText={fieldErrors.password}
          secureTextEntry
        />
        <TextField
          label={t("auth_confirm_password_label")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          errorText={fieldErrors.confirmPassword}
          secureTextEntry
        />

        <Checkbox
          label={t("auth_terms_label")}
          checked={termsAccepted}
          onChange={setTermsAccepted}
          errorText={fieldErrors.termsAccepted}
        />
        <Checkbox
          label={t("auth_privacy_label")}
          checked={privacyNoticeAccepted}
          onChange={setPrivacyNoticeAccepted}
          errorText={fieldErrors.privacyNoticeAccepted}
        />
        <Checkbox
          label={t("auth_location_policy_label")}
          checked={locationPolicyAccepted}
          onChange={setLocationPolicyAccepted}
          errorText={fieldErrors.locationPolicyAccepted}
        />
        <Checkbox
          label={t("auth_community_rules_label")}
          checked={communityRulesAccepted}
          onChange={setCommunityRulesAccepted}
          errorText={fieldErrors.communityRulesAccepted}
        />

        {submitError && <Text className="text-critical">{submitError}</Text>}

        <Button variant="primary" loading={submitting} onPress={handleSubmit}>
          {t("auth_register_submit")}
        </Button>

        <Stack direction="row" gap="1" justify="center">
          <Text tone="muted">{t("auth_already_have_account")}</Text>
          <Link href="/sign-in">
            <Text className="text-primary">{t("auth_sign_in_link")}</Text>
          </Link>
        </Stack>
      </Stack>
    </SafeAreaContainer>
  );
}
