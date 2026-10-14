"use client";

import Link from "next/link";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";

type OpenCaseRow =
  Database["public"]["Functions"]["list_public_open_cases"]["Returns"][number];

export function PublicOpenCasesList({ cases }: { cases: OpenCaseRow[] }) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <main>
      <h1>{t("public_open_cases_heading")}</h1>
      <nav>
        <Link href="/share/rescues">{t("public_nav_history")}</Link>
        <Link href="/directory">{t("public_nav_directory")}</Link>
        <Link href="/safety">{t("public_nav_safety")}</Link>
      </nav>
      {cases.length === 0 && <p>{t("public_open_cases_empty")}</p>}
      <ul>
        {cases.map((c) => (
          <li key={c.id}>
            <Link href={`/share/case/${c.public_reference}`}>
              {t(
                `incident_${c.incident_type}` as Parameters<
                  typeof translate
                >[1],
              )}
            </Link>
            {" - "}
            {t(`urgency_${c.urgency}` as Parameters<typeof translate>[1])}
            {" - "}
            {[c.upazila_or_thana, c.district, c.division]
              .filter(Boolean)
              .join(", ")}
          </li>
        ))}
      </ul>
    </main>
  );
}
