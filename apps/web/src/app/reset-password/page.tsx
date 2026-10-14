"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { confirmPasswordReset } from "@rescue-alert/api";
import { passwordResetConfirmSchema } from "@rescue-alert/validation";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../../lib/supabase/client";

/**
 * Reached only via /auth/callback after a recovery link, which
 * already establishes a recovery session - this page's only job is
 * updateUser({ password }) against that session.
 */
export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
      createClient(),
      result.data.password,
    );
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-text">{t("auth_reset_password_success")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("auth_reset_password_heading")}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("auth_password_label")}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("auth_confirm_password_label")}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>

        {error && (
          <p role="alert" className="text-critical">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("auth_reset_password_submit")}
        </button>
      </form>
    </main>
  );
}
