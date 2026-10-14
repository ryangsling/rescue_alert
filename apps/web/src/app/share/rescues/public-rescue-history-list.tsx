"use client";

import Link from "next/link";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";

type RescueHistoryRow =
  Database["public"]["Functions"]["list_public_rescue_history"]["Returns"][number];

export function PublicRescueHistoryList({
  rescues,
}: {
  rescues: RescueHistoryRow[];
}) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <main>
      <h1>{t("public_rescue_history_heading")}</h1>
      <nav>
        <Link href="/share/open-cases">{t("public_nav_open_cases")}</Link>
        <Link href="/directory">{t("public_nav_directory")}</Link>
        <Link href="/safety">{t("public_nav_safety")}</Link>
      </nav>
      {rescues.length === 0 && <p>{t("public_rescue_history_empty")}</p>}
      <ul>
        {rescues.map((r) => (
          <li key={r.public_reference}>
            {t(
              `incident_${r.incident_type}` as Parameters<typeof translate>[1],
            )}
            {" - "}
            {t(`outcome_${r.outcome}` as Parameters<typeof translate>[1])}
            {" - "}
            {[r.upazila_or_thana, r.district, r.division]
              .filter(Boolean)
              .join(", ")}
          </li>
        ))}
      </ul>
    </main>
  );
}
