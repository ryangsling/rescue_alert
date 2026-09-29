import type { Database } from "@rescue-alert/types";
import type { TranslationKey } from "@rescue-alert/localization";

export type IncidentType = Database["public"]["Enums"]["incident_type"];

/** PRD 8.1's 16 incident types, in the same order used by the report wizard. */
export const INCIDENT_TYPES: IncidentType[] = [
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

export const INCIDENT_LABEL_KEY: Record<IncidentType, TranslationKey> = {
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
