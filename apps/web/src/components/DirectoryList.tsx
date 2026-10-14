"use client";

import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";

type DirectoryRow =
  Database["public"]["Functions"]["list_verified_directory"]["Returns"][number];

const ORG_TYPE_LABEL_KEY: Record<
  DirectoryRow["org_type"],
  Parameters<typeof translate>[1]
> = {
  clinic: "org_type_clinic",
  shelter: "org_type_shelter",
  ngo: "org_type_ngo",
  rescue_group: "org_type_rescue_group",
  individual_coordinator: "org_type_individual_coordinator",
};

export function DirectoryList({
  organizations,
}: {
  organizations: DirectoryRow[];
}) {
  const { locale } = useLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate(locale, key, params);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-text">{t("directory_heading")}</h1>

      {organizations.length === 0 ? (
        <p className="text-text-muted">{t("directory_empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-text">{org.name}</h2>
                <span className="rounded-full bg-support-container px-3 py-1 text-sm text-support">
                  {t(ORG_TYPE_LABEL_KEY[org.org_type])}
                </span>
              </div>
              {org.description ? (
                <p className="text-text">{org.description}</p>
              ) : null}
              {org.service_area ? (
                <p className="text-text-muted">{org.service_area}</p>
              ) : null}
              {org.contact_method ? (
                <p className="text-text-muted">{org.contact_method}</p>
              ) : null}
              <p className="text-sm">
                {org.is_currently_available
                  ? t("directory_available_label")
                  : t("directory_unavailable_label")}
                {org.hours_text ? ` · ${org.hours_text}` : ""}
              </p>
              {org.org_type === "clinic" && org.clinic_specializations ? (
                <p className="text-text-muted">{org.clinic_specializations}</p>
              ) : null}
              {org.org_type === "clinic" && org.clinic_emergency_capable ? (
                <p className="text-sm text-support">
                  {t("directory_emergency_capable_label")}
                </p>
              ) : null}
              {org.org_type === "shelter" &&
              org.shelter_capacity_total != null ? (
                <p className="text-text-muted">
                  {t("directory_shelter_capacity_label", {
                    available: org.shelter_capacity_available ?? 0,
                    total: org.shelter_capacity_total,
                  })}
                </p>
              ) : null}
              {Array.isArray(org.services) && org.services.length > 0 ? (
                <ul className="list-disc pl-5 text-text-muted">
                  {(
                    org.services as {
                      name: string;
                      description: string | null;
                    }[]
                  ).map((service) => (
                    <li key={service.name}>
                      {service.name}
                      {service.description ? ` - ${service.description}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-text-muted">
                {t("directory_last_confirmed_label", {
                  date: new Date(org.last_confirmed_at).toLocaleDateString(
                    locale,
                  ),
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
