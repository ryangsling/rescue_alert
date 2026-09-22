/**
 * English catalog. Canonical structure - packages/localization/src/
 * catalogs/bn.ts is typed to satisfy exactly this shape (see types.ts),
 * so a key missing from either catalog is a TypeScript compile error,
 * not just a runtime gap. Sentences are complete, not fragments to
 * concatenate (DESIGN.md section 16), matching wording from DESIGN.md
 * section 17.2 and PRD section 12.5 where it specifies exact copy.
 */
export const en = {
  app_name: "Rescue Alert",

  action_submit: "Submit",
  action_cancel: "Cancel",
  action_retry: "Try again",
  action_save: "Save",
  action_close: "Close",
  action_i_can_help: "I can help",
  action_report_animal: "Report an animal",

  status_responder_en_route: "Responder en route",
  status_animal_located: "Animal located",
  status_resolved: "Resolved",
  status_closed: "Closed",

  // DESIGN.md section 17.2 preferred wording, used verbatim.
  content_last_seen_minutes: "Animal last seen {minutes} minutes ago",
  content_location_approximate: "Location is approximate",
  content_professional_help_recommended: "Professional help recommended",
  content_could_not_send:
    "Could not send. Your report is saved on this device.",

  // PRD section 12.5 disclaimers, used verbatim.
  disclaimer_no_guaranteed_responder:
    "This app does not guarantee a responder.",
  disclaimer_urgency_not_diagnosis:
    "Community-reported urgency is not a veterinary diagnosis.",
  disclaimer_volunteers_independent:
    "Volunteers act independently unless explicitly representing a verified organization.",
  disclaimer_contact_authorities:
    "For immediate human danger, contact appropriate public authorities or medical services.",

  error_generic_heading: "Something went wrong",
  error_generic_message: "Your data is safe. Please try again.",
  error_offline_heading: "You're offline",
  error_offline_message: "Changes will sync when you're back online.",

  form_required_field: "This field is required",
} as const;

export type TranslationKey = keyof typeof en;
