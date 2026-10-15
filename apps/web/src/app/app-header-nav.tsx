"use client";

import Link from "next/link";
import { translate, useLocale } from "@rescue-alert/localization";

/**
 * design/DESIGN.md 13.2 "Web navigation" - the real gap this closes:
 * every route below existed and worked (report, account, directory,
 * organizations, moderation, sign-in) but nothing on any page ever
 * linked to any of them. A visitor landing on "/" had no way to reach
 * anything else in the app. This is the single shared header every
 * page gets via the root layout, not a per-page ad hoc link list.
 */
export function AppHeaderNav({
  isAuthenticated,
  isModerator,
}: {
  isAuthenticated: boolean;
  isModerator: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4">
        <Link href="/" className="text-lg font-bold text-text">
          Rescue Alert
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/report" className="text-text">
                {t("nav_report_action")}
              </Link>
              <Link href="/directory" className="text-text">
                {t("site_nav_directory")}
              </Link>
              <Link href="/organizations" className="text-text">
                {t("site_nav_organizations")}
              </Link>
              {isModerator && (
                <Link href="/moderation" className="text-text">
                  {t("moderation_dashboard_heading")}
                </Link>
              )}
              <Link href="/account" className="text-text">
                {t("nav_account_action")}
              </Link>
            </>
          ) : (
            <>
              <Link href="/share/open-cases" className="text-text">
                {t("public_nav_open_cases")}
              </Link>
              <Link href="/directory" className="text-text">
                {t("site_nav_directory")}
              </Link>
              <Link href="/safety" className="text-text">
                {t("public_nav_safety")}
              </Link>
              <Link href="/sign-in" className="text-text">
                {t("site_nav_sign_in")}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "bn" : "en")}
          className="rounded-full border border-border px-4 py-2 text-text"
        >
          {locale === "en" ? "বাংলা" : "English"}
        </button>
      </nav>
    </header>
  );
}
