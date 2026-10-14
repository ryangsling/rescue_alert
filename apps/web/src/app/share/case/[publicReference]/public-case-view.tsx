"use client";

import Link from "next/link";
import { translate, useLocale } from "@rescue-alert/localization";

export interface PublicCaseDetail {
  id: string;
  public_reference: string;
  incident_type: string;
  animal_type: string | null;
  urgency: string;
  status: string;
  title: string;
  division: string | null;
  district: string | null;
  upazila_or_thana: string | null;
  reported_at: string;
  updated_at: string;
  last_official_update: string | null;
  needs: { need_type: string; is_fulfilled: boolean }[];
  media: { id: string; storage_path: string }[];
}

type T = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => string;

export function PublicCaseView({
  detail,
  mediaUrls,
}: {
  detail: PublicCaseDetail;
  mediaUrls: (string | null)[];
}) {
  const { locale } = useLocale();
  const t: T = (key, params) => translate(locale, key, params);

  const area = [detail.upazila_or_thana, detail.district, detail.division]
    .filter(Boolean)
    .join(", ");
  const unfulfilledNeeds = detail.needs.filter((n) => !n.is_fulfilled);

  return (
    <main>
      <h1>
        {t(
          `incident_${detail.incident_type}` as Parameters<typeof translate>[1],
        )}
      </h1>
      <p>{t(`urgency_${detail.urgency}` as Parameters<typeof translate>[1])}</p>
      <p>{t(`status_${detail.status}` as Parameters<typeof translate>[1])}</p>
      <p>{area}</p>

      {mediaUrls.filter(Boolean).length > 0 && (
        <div>
          {mediaUrls
            .filter((url): url is string => Boolean(url))
            .map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" style={{ maxWidth: "100%" }} />
            ))}
        </div>
      )}

      {unfulfilledNeeds.length > 0 && (
        <section>
          <h2>{t("public_required_assistance_heading")}</h2>
          <ul>
            {unfulfilledNeeds.map((n) => (
              <li key={n.need_type}>
                {t(
                  `assistance_${n.need_type}` as Parameters<
                    typeof translate
                  >[1],
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.last_official_update && (
        <section>
          <h2>{t("public_last_update_heading")}</h2>
          <p>{detail.last_official_update}</p>
        </section>
      )}

      <p>
        <Link href="/sign-in">{t("public_sign_in_to_respond")}</Link>
      </p>
      <p>
        <a href={`rescuealert://case/${detail.id}`}>
          {t("public_open_in_app_action")}
        </a>
      </p>
    </main>
  );
}
