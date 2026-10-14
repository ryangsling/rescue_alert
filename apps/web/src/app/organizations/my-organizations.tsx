"use client";

import { useEffect, useState } from "react";
import {
  createOrganization,
  updateOrganization,
  confirmOrganizationListing,
  listMyOrganizations,
  listOrganizationServices,
  upsertOrganizationService,
  removeOrganizationService,
  getOrganizationAvailability,
  setOrganizationAvailability,
} from "@rescue-alert/api";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../../lib/supabase/client";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationServiceRow =
  Database["public"]["Tables"]["organization_services"]["Row"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];
type IncidentType = Database["public"]["Enums"]["incident_type"];
type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];
type T = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => string;

const ORG_TYPES: OrganizationType[] = [
  "clinic",
  "shelter",
  "ngo",
  "rescue_group",
  "individual_coordinator",
];

const ORG_TYPE_LABEL_KEY: Record<
  OrganizationType,
  Parameters<typeof translate>[1]
> = {
  clinic: "org_type_clinic",
  shelter: "org_type_shelter",
  ngo: "org_type_ngo",
  rescue_group: "org_type_rescue_group",
  individual_coordinator: "org_type_individual_coordinator",
};

const URGENCY_LEVELS: UrgencyLevel[] = [
  "critical",
  "urgent",
  "support_needed",
  "adoption_community",
];
const URGENCY_LABEL_KEY: Record<UrgencyLevel, Parameters<typeof translate>[1]> =
  {
    critical: "urgency_critical",
    urgent: "urgency_urgent",
    support_needed: "urgency_support_needed",
    adoption_community: "urgency_adoption_community",
  };

const INCIDENT_TYPES: IncidentType[] = [
  "injured_animal",
  "road_accident",
  "critically_ill_animal",
  "trapped_animal",
  "abandoned_animal",
  "abuse_or_cruelty_suspected",
  "mother_with_babies",
  "orphaned_babies",
  "traffic_risk_animal",
  "temporary_foster_needed",
  "shelter_needed",
  "transport_needed",
  "veterinary_treatment_needed",
  "lost_animal_found",
  "adoption_needed",
  "other_animal_welfare_concern",
];
const INCIDENT_LABEL_KEY: Record<
  IncidentType,
  Parameters<typeof translate>[1]
> = {
  injured_animal: "incident_injured_animal",
  road_accident: "incident_road_accident",
  critically_ill_animal: "incident_critically_ill_animal",
  trapped_animal: "incident_trapped_animal",
  abandoned_animal: "incident_abandoned_animal",
  abuse_or_cruelty_suspected: "incident_abuse_or_cruelty_suspected",
  mother_with_babies: "incident_mother_with_babies",
  orphaned_babies: "incident_orphaned_babies",
  traffic_risk_animal: "incident_traffic_risk_animal",
  temporary_foster_needed: "incident_temporary_foster_needed",
  shelter_needed: "incident_shelter_needed",
  transport_needed: "incident_transport_needed",
  veterinary_treatment_needed: "incident_veterinary_treatment_needed",
  lost_animal_found: "incident_lost_animal_found",
  adoption_needed: "incident_adoption_needed",
  other_animal_welfare_concern: "incident_other_animal_welfare_concern",
};

export function MyOrganizations({ userId }: { userId: string }) {
  const { locale } = useLocale();
  const t: T = (key, params) => translate(locale, key, params);
  const supabase = createClient();

  const [myOrgs, setMyOrgs] = useState<
    { role: string; organizations: OrganizationRow }[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [services, setServices] = useState<OrganizationServiceRow[]>([]);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<OrganizationType>("ngo");

  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [serviceArea, setServiceArea] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [description, setDescription] = useState("");

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");

  const [isAvailable, setIsAvailable] = useState(true);
  const [hoursText, setHoursText] = useState("");
  const [optedUrgency, setOptedUrgency] = useState<Set<UrgencyLevel>>(
    new Set(),
  );
  const [optedIncident, setOptedIncident] = useState<Set<IncidentType>>(
    new Set(),
  );

  const selected = myOrgs.find(
    (o) => o.organizations.id === selectedId,
  )?.organizations;

  // Resets the profile-edit fields when the selected organization
  // changes, without an Effect - React's own documented pattern for
  // "adjusting state when a prop changes" (adjusting during render,
  // not after commit, so there is no stale-then-correct flash).
  if (selected && selected.id !== editingOrgId) {
    setEditingOrgId(selected.id);
    setServiceArea(selected.service_area ?? "");
    setContactMethod(selected.contact_method ?? "");
    setDescription(selected.description ?? "");
  }

  async function fetchMyOrganizations() {
    const { data } = await listMyOrganizations(supabase, userId);
    return (data ?? []) as unknown as {
      role: string;
      organizations: OrganizationRow;
    }[];
  }

  async function loadOrgs() {
    setMyOrgs(await fetchMyOrganizations());
  }

  useEffect(() => {
    fetchMyOrganizations().then((orgs) => setMyOrgs(orgs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!selected) return;
    listOrganizationServices(supabase, selected.id).then(({ data }) =>
      setServices(data ?? []),
    );
    getOrganizationAvailability(supabase, selected.id).then(({ data }) => {
      setIsAvailable(data?.is_currently_available ?? true);
      setHoursText(data?.hours_text ?? "");
      setOptedUrgency(new Set(data?.opted_in_urgency_levels ?? []));
      setOptedIncident(new Set(data?.opted_in_incident_types ?? []));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const { data } = await createOrganization(supabase, userId, {
      name: newName.trim(),
      orgType: newType,
    });
    setNewName("");
    await loadOrgs();
    if (data) setSelectedId(data.id);
  }

  async function handleSaveProfile() {
    if (!selected) return;
    await updateOrganization(supabase, selected.id, {
      serviceArea: serviceArea || undefined,
      contactMethod: contactMethod || undefined,
      description: description || undefined,
    });
    await loadOrgs();
  }

  async function handleConfirmListing() {
    if (!selected) return;
    await confirmOrganizationListing(supabase, selected.id);
    await loadOrgs();
  }

  async function handleAddService() {
    if (!selected || !newServiceName.trim()) return;
    await upsertOrganizationService(supabase, selected.id, {
      serviceName: newServiceName.trim(),
      description: newServiceDescription || undefined,
    });
    setNewServiceName("");
    setNewServiceDescription("");
    const { data } = await listOrganizationServices(supabase, selected.id);
    setServices(data ?? []);
  }

  async function handleRemoveService(serviceId: string) {
    await removeOrganizationService(supabase, serviceId);
    setServices((current) => current.filter((s) => s.id !== serviceId));
  }

  function toggleUrgency(level: UrgencyLevel) {
    setOptedUrgency((current) => {
      const next = new Set(current);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  function toggleIncident(type: IncidentType) {
    setOptedIncident((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleSaveAvailability() {
    if (!selected) return;
    await setOrganizationAvailability(supabase, selected.id, {
      isCurrentlyAvailable: isAvailable,
      hoursText: hoursText || undefined,
      optedInUrgencyLevels: Array.from(optedUrgency),
      optedInIncidentTypes: Array.from(optedIncident),
    });
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("my_organizations_heading")}
      </h1>

      <div className="flex flex-wrap gap-2">
        {myOrgs.map(({ organizations: org }) => (
          <button
            key={org.id}
            type="button"
            onClick={() => setSelectedId(org.id)}
            className={[
              "rounded-full border px-4 py-2 text-text",
              org.id === selectedId ? "border-primary" : "border-border",
            ].join(" ")}
          >
            {org.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border p-4">
        <h2 className="font-semibold text-text">
          {t("organization_create_heading")}
        </h2>
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("organization_name_label")}</span>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text">{t("organization_type_label")}</span>
          <select
            value={newType}
            onChange={(event) =>
              setNewType(event.target.value as OrganizationType)
            }
            className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
          >
            {ORG_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(ORG_TYPE_LABEL_KEY[type])}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleCreate}
          className="min-h-11 self-start rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("organization_create_submit")}
        </button>
      </div>

      {selected ? (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-support">
            {selected.verification_status === "verified"
              ? t("organization_verification_verified_notice")
              : t("organization_verification_pending_notice")}
          </p>

          <div className="flex flex-col gap-2 rounded-md border border-border p-4">
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("organization_service_area_label")}
              </span>
              <input
                value={serviceArea}
                onChange={(event) => setServiceArea(event.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("organization_contact_method_label")}
              </span>
              <input
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("organization_description_label")}
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="rounded-md border border-border bg-surface p-3 text-text"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="min-h-11 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
              >
                {t("organization_save_action")}
              </button>
              <button
                type="button"
                onClick={handleConfirmListing}
                className="min-h-11 rounded-full border border-border px-4 py-2 text-text"
              >
                {t("organization_confirm_listing_action")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border p-4">
            <h2 className="font-semibold text-text">
              {t("organization_services_heading")}
            </h2>
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-text">
                  {service.service_name}
                  {service.description ? ` - ${service.description}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(service.id)}
                  className="text-sm text-critical"
                >
                  {t("organization_service_remove_action")}
                </button>
              </div>
            ))}
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("organization_service_name_label")}
              </span>
              <input
                value={newServiceName}
                onChange={(event) => setNewServiceName(event.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text">
                {t("organization_service_description_label")}
              </span>
              <input
                value={newServiceDescription}
                onChange={(event) =>
                  setNewServiceDescription(event.target.value)
                }
                className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>
            <button
              type="button"
              onClick={handleAddService}
              className="min-h-11 self-start rounded-full border border-border px-4 py-2 text-text"
            >
              {t("organization_service_add_action")}
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border p-4">
            <h2 className="font-semibold text-text">
              {t("organization_availability_heading")}
            </h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(event) => setIsAvailable(event.target.checked)}
              />
              <span className="text-text">
                {t("organization_available_toggle_label")}
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text">{t("organization_hours_label")}</span>
              <input
                value={hoursText}
                onChange={(event) => setHoursText(event.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-4 text-text"
              />
            </label>

            <h3 className="font-semibold text-text">
              {t("organization_opted_in_urgency_heading")}
            </h3>
            {URGENCY_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optedUrgency.has(level)}
                  onChange={() => toggleUrgency(level)}
                />
                <span className="text-text">{t(URGENCY_LABEL_KEY[level])}</span>
              </label>
            ))}

            <h3 className="font-semibold text-text">
              {t("organization_opted_in_incident_heading")}
            </h3>
            {INCIDENT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optedIncident.has(type)}
                  onChange={() => toggleIncident(type)}
                />
                <span className="text-text">{t(INCIDENT_LABEL_KEY[type])}</span>
              </label>
            ))}

            <button
              type="button"
              onClick={handleSaveAvailability}
              className="min-h-11 self-start rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
            >
              {t("organization_availability_save_action")}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
