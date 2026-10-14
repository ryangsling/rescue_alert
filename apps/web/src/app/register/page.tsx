"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { registerUser } from "@rescue-alert/api";
import { registrationSchema } from "@rescue-alert/validation";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../../lib/supabase/client";

type FieldErrors = Partial<Record<string, string>>;

export default function RegisterPage() {
  const { locale } = useLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate(locale, key, params);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
    const { error } = await registerUser(createClient(), result.data, {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
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
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-text">
          {t("auth_register_success_heading")}
        </h1>
        <p className="text-text-muted">
          {t("auth_register_success_message", { email: registeredEmail })}
        </p>
        <Link href="/sign-in" className="text-primary underline">
          {t("auth_sign_in_link")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("auth_register_heading")}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field
          label={t("auth_full_name_label")}
          value={fullName}
          onChange={setFullName}
          error={fieldErrors.fullName}
        />
        <Field
          label={t("auth_email_label")}
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <Field
          label={t("auth_phone_label")}
          value={phone}
          onChange={setPhone}
          error={fieldErrors.phone}
          placeholder="01XXXXXXXXX"
        />
        <Field
          label={t("auth_city_label")}
          value={city}
          onChange={setCity}
          optional
        />
        <Field
          label={t("auth_area_label")}
          value={area}
          onChange={setArea}
          optional
        />
        <Field
          label={t("auth_password_label")}
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <Field
          label={t("auth_confirm_password_label")}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
        />

        <ConsentCheckbox
          label={t("auth_terms_label")}
          checked={termsAccepted}
          onChange={setTermsAccepted}
          error={fieldErrors.termsAccepted}
        />
        <ConsentCheckbox
          label={t("auth_privacy_label")}
          checked={privacyNoticeAccepted}
          onChange={setPrivacyNoticeAccepted}
          error={fieldErrors.privacyNoticeAccepted}
        />
        <ConsentCheckbox
          label={t("auth_location_policy_label")}
          checked={locationPolicyAccepted}
          onChange={setLocationPolicyAccepted}
          error={fieldErrors.locationPolicyAccepted}
        />
        <ConsentCheckbox
          label={t("auth_community_rules_label")}
          checked={communityRulesAccepted}
          onChange={setCommunityRulesAccepted}
          error={fieldErrors.communityRulesAccepted}
        />

        {submitError && (
          <p role="alert" className="text-critical">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("auth_register_submit")}
        </button>
      </form>

      <p className="text-text-muted">
        {t("auth_already_have_account")}{" "}
        <Link href="/sign-in" className="text-primary underline">
          {t("auth_sign_in_link")}
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  optional = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-text">
        {label}
        {optional ? "" : " *"}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-12 rounded-md border bg-surface px-4 text-text ${error ? "border-critical" : "border-border"}`}
      />
      {error && (
        <span role="alert" className="text-critical">
          {error}
        </span>
      )}
    </label>
  );
}

function ConsentCheckbox({
  label,
  checked,
  onChange,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={error ? "text-critical" : "text-text"}>{label}</span>
    </label>
  );
}
