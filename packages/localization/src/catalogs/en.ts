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
} as const;

export type TranslationKey = keyof typeof en;
