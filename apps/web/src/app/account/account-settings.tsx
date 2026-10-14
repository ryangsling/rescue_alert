"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getEdgeFunctionErrorCode,
  getUserRescueHistory,
  requestAccountDeletion,
  signOutAllDevices,
  signOutCurrentDevice,
} from "@rescue-alert/api";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../../lib/supabase/client";

type RescueHistoryRow =
  Database["public"]["Functions"]["get_user_rescue_history"]["Returns"][number];

const CONTRIBUTION_LABEL_KEY: Record<
  RescueHistoryRow["category"],
  Parameters<typeof translate>[1]
> = {
  on_site_responder: "contribution_on_site_responder",
  transport_volunteer: "contribution_transport_volunteer",
  foster_provider: "contribution_foster_provider",
  veterinary_support: "contribution_veterinary_support",
  case_coordinator: "contribution_case_coordinator",
  organization_responder: "contribution_organization_responder",
  adoption_facilitator: "contribution_adoption_facilitator",
  moderator_contribution: "contribution_moderator_contribution",
};

export function AccountSettings({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [rescueHistory, setRescueHistory] = useState<RescueHistoryRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await getUserRescueHistory(createClient(), userId);
      setRescueHistory(data ?? []);
    }
    void load();
  }, [userId]);

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

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">
          {t("rescue_history_heading")}
        </h2>
        {rescueHistory.length === 0 ? (
          <p className="text-text-muted">{t("rescue_history_empty")}</p>
        ) : (
          rescueHistory.map((row) => (
            <div
              key={`${row.case_id}-${row.category}`}
              className="rounded-md border border-border p-3"
            >
              <p className="font-semibold text-text">{row.case_title}</p>
              <p className="text-text-muted">
                {t(CONTRIBUTION_LABEL_KEY[row.category])}
              </p>
              <p className="text-sm text-text-muted">
                {new Date(row.closed_at).toLocaleDateString(locale)}
              </p>
            </div>
          ))
        )}
      </div>

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
