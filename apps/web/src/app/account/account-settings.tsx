"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getEdgeFunctionErrorCode,
  requestAccountDeletion,
  signOutAllDevices,
  signOutCurrentDevice,
} from "@rescue-alert/api";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../../lib/supabase/client";

export function AccountSettings({ email }: { email: string }) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOutCurrentDevice(createClient());
    setBusy(false);
    router.push("/sign-in");
  }

  async function handleSignOutAllDevices() {
    setBusy(true);
    await signOutAllDevices(createClient());
    setBusy(false);
    router.push("/sign-in");
  }

  async function handleDelete(event: FormEvent) {
    event.preventDefault();
    setDeleteError(null);
    setBusy(true);
    const { error } = await requestAccountDeletion(
      createClient(),
      deletePassword,
    );
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
    router.push("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("account_settings_heading")}
      </h1>
      <p className="text-text-muted">{email}</p>

      <button
        type="button"
        disabled={busy}
        onClick={handleSignOut}
        className="min-h-12 rounded-full border border-border px-4 py-2 text-text disabled:opacity-50"
      >
        {t("account_sign_out")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={handleSignOutAllDevices}
        className="min-h-12 rounded-full border border-border px-4 py-2 text-text disabled:opacity-50"
      >
        {t("account_sign_out_all_devices")}
      </button>

      <div className="flex flex-col gap-3 rounded-md border border-critical p-4">
        <h2 className="font-semibold text-critical">
          {t("account_delete_heading")}
        </h2>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="min-h-12 rounded-full bg-critical px-4 py-2 font-semibold text-on-primary"
          >
            {t("account_delete_confirm")}
          </button>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleDelete}>
            <p className="text-text-muted">{t("account_delete_warning")}</p>
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("auth_current_password_label")}
              </span>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>
            {deleteError && <p className="text-critical">{deleteError}</p>}
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 rounded-full bg-critical px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
            >
              {t("account_delete_confirm")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
