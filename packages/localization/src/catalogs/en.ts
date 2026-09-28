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

  // PRD 7.1 registration and onboarding.
  auth_full_name_label: "Full name",
  auth_email_label: "Email",
  auth_phone_label: "Phone number",
  auth_city_label: "City",
  auth_area_label: "Area",
  auth_password_label: "Password",
  auth_confirm_password_label: "Confirm password",
  auth_current_password_label: "Current password",
  auth_terms_label: "I accept the Terms of Service",
  auth_privacy_label: "I accept the Privacy Notice",
  auth_location_policy_label: "I accept the Location Policy",
  auth_community_rules_label: "I accept the Community Rules",
  auth_register_heading: "Create your account",
  auth_register_submit: "Create account",
  auth_register_success_heading: "Check your email",
  auth_register_success_message:
    "We sent a verification link to {email}. Verify your email, then sign in.",
  auth_already_have_account: "Already have an account?",
  auth_sign_in_link: "Sign in",
  auth_sign_in_heading: "Sign in",
  auth_forgot_password_link: "Forgot password?",
  auth_no_account: "Don't have an account?",
  auth_register_link: "Create one",
  auth_sign_in_error: "Incorrect email or password",
  auth_forgot_password_heading: "Reset your password",
  auth_forgot_password_instructions:
    "Enter your email and we'll send a link to reset your password.",
  auth_forgot_password_submit: "Send reset link",
  auth_forgot_password_success:
    "If an account exists for {email}, a reset link has been sent.",
  auth_reset_password_heading: "Choose a new password",
  auth_reset_password_submit: "Update password",
  auth_reset_password_success: "Your password has been updated.",

  onboarding_capabilities_heading: "How would you like to help?",
  onboarding_capabilities_instructions: "Optional. Select any that apply.",
  onboarding_animal_types_heading: "Preferred animal types",
  onboarding_alert_radius_heading: "Alert radius",
  onboarding_alert_radius_unit_km: "{km} km",
  onboarding_continue: "Continue",
  onboarding_finish: "Finish",
  capability_on_site_rescue: "On-site rescue",
  capability_transport: "Transport",
  capability_veterinary_professional: "Veterinary professional",
  capability_veterinary_assistant: "Veterinary assistant",
  capability_temporary_foster: "Temporary foster",
  capability_shelter_coordination: "Shelter coordination",
  capability_adoption_support: "Adoption support",
  capability_case_coordination: "Case coordination",
  capability_financial_support_interest: "Financial support",

  account_settings_heading: "Account",
  account_sign_out: "Sign out",
  account_sign_out_all_devices: "Sign out of all devices",
  account_delete_heading: "Delete account",
  account_delete_warning:
    "This cannot be undone. Enter your password to confirm.",
  account_delete_confirm: "Delete my account",
  account_delete_wrong_password: "That password is incorrect",

  // PRD 7.2, DESIGN.md 14.3 report flow.
  report_step_x_of_7: "Step {step} of 7",
  report_incident_type_heading: "What happened?",
  report_urgency_heading: "How urgent is this?",
  incident_injured_animal: "Injured animal",
  incident_road_accident: "Road accident",
  incident_critically_ill_animal: "Critically ill animal",
  incident_trapped_animal: "Trapped animal",
  incident_abandoned_animal: "Abandoned animal",
  incident_abuse_or_cruelty_suspected: "Abuse or cruelty suspected",
  incident_mother_with_babies: "Mother with babies",
  incident_orphaned_babies: "Orphaned babies",
  incident_traffic_risk_animal: "Animal creating traffic risk",
  incident_temporary_foster_needed: "Temporary foster needed",
  incident_shelter_needed: "Shelter needed",
  incident_transport_needed: "Transport needed",
  incident_veterinary_treatment_needed: "Veterinary treatment needed",
  incident_lost_animal_found: "Lost animal found",
  incident_adoption_needed: "Adoption needed",
  incident_other_animal_welfare_concern: "Other animal-welfare concern",
  urgency_critical: "Critical",
  urgency_urgent: "Urgent",
  urgency_support_needed: "Support needed",
  urgency_adoption_community: "Adoption or community",
  report_animal_type_heading: "Animal type",
  report_photo_heading: "Add a photo",
  report_photo_instructions:
    "At least one photo helps responders understand the situation.",
  report_photo_add: "Add photo",
  report_photo_remove: "Remove",
  report_photo_processing: "Processing photo...",
  report_condition_heading: "Describe what you see",
  report_condition_placeholder: "Visible injuries, behavior, surroundings...",
  report_location_heading: "Confirm location",
  report_location_use_gps: "Use my current location",
  report_location_manual_instructions:
    "Or enter the location manually. Adjusting a pin on a map is coming soon.",
  report_latitude_label: "Latitude",
  report_longitude_label: "Longitude",
  report_landmark_heading: "Add a landmark and details",
  report_still_here_label: "I am still at this location",
  report_review_heading: "Review safety and privacy",
  report_preview_heading: "Preview and submit",
  report_submit: "Submit report",
  report_success_heading: "Report submitted",
  report_success_message: "Your report is public. Reference {reference}.",
  report_duplicate_warning_heading: "Similar reports nearby",
  report_duplicate_warning_message:
    "There may already be a report for this animal. Review before submitting a new one.",
  report_back: "Back",
} as const;

export type TranslationKey = keyof typeof en;
