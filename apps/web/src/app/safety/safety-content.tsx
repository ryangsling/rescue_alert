"use client";

import Link from "next/link";
import { translate, useLocale } from "@rescue-alert/localization";

export function SafetyContent() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <main>
      <h1>{t("safety_page_heading")}</h1>
      <p>
        <strong>{t("safety_no_guarantee_disclaimer")}</strong>
      </p>

      <section>
        <h2>{t("safety_bite_heading")}</h2>
        <p>{t("safety_bite_guidance")}</p>
      </section>

      <section>
        <h2>{t("safety_rabies_heading")}</h2>
        <p>{t("safety_rabies_guidance")}</p>
      </section>

      <section>
        <h2>{t("safety_hazard_heading")}</h2>
        <p>{t("safety_hazard_guidance")}</p>
      </section>

      <nav>
        <Link href="/share/open-cases">{t("public_nav_open_cases")}</Link>
        <Link href="/directory">{t("public_nav_directory")}</Link>
      </nav>
    </main>
  );
}
