"use client";

import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "@rescue-alert/api";
import { passwordResetRequestSchema } from "@rescue-alert/validation";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate(locale, key, params);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = passwordResetRequestSchema.safeParse({ email });
    if (!result.success) return;

    setSubmitting(true);
    // AUTH-006: request always "succeeds" from the UI's point of view
    // regardless of whether the account exists - resetPasswordForEmail
    // itself never reveals that, so there is nothing to branch on here.
    await requestPasswordReset(
      createClient(),
      result.data.email,
      `${window.location.origin}/auth/callback?next=/reset-password`,
    );
    setSubmitting(false);
    setSentTo(result.data.email);
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-text">
          {t("auth_forgot_password_heading")}
        </h1>
        <p className="text-text-muted">
          {t("auth_forgot_password_success", { email: sentTo })}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("auth_forgot_password_heading")}
      </h1>
      <p className="text-text-muted">
        {t("auth_forgot_password_instructions")}
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("auth_email_label")}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("auth_forgot_password_submit")}
        </button>
      </form>
    </main>
  );
}
