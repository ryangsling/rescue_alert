"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@rescue-alert/api";
import { signInSchema } from "@rescue-alert/validation";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../../lib/supabase/client";

export default function SignInPage() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      // AUTH-006: the same generic message whether the email exists,
      // the password is wrong, or the email is malformed - never
      // reveal which case applies.
      setError(t("auth_sign_in_error"));
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(createClient(), result.data);
    setSubmitting(false);

    if (signInError) {
      setError(t("auth_sign_in_error"));
      return;
    }
    router.push("/");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("auth_sign_in_heading")}
      </h1>

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
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("auth_password_label")}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>

        {error && <p className="text-critical">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("auth_sign_in_heading")}
        </button>
      </form>

      <Link href="/forgot-password" className="text-primary underline">
        {t("auth_forgot_password_link")}
      </Link>
      <p className="text-text-muted">
        {t("auth_no_account")}{" "}
        <Link href="/register" className="text-primary underline">
          {t("auth_register_link")}
        </Link>
      </p>
    </main>
  );
}
