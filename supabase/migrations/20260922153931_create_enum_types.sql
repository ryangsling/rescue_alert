
-- App-level roles. "guest" is never stored - it represents an
-- unauthenticated visitor and exists only for documentation.
-- PRD section 6.
create type app_role as enum (
  'guest',
  'registered_user',
  'trusted_volunteer',
  'organization_member',
  'organization_administrator',
  'moderator',
  'administrator'
);

-- PRD section 8.1.
create type incident_type as enum (
  'injured_animal',
  'road_accident',
  'critically_ill_animal',
  'trapped_animal',
  'abandoned_animal',
  'abuse_or_cruelty_suspected',
  'mother_with_babies',
  'orphaned_babies',
  'traffic_risk_animal',
  'temporary_foster_needed',
  'shelter_needed',
  'transport_needed',
  'veterinary_treatment_needed',
  'lost_animal_found',
  'adoption_needed',
  'other_animal_welfare_concern'
);

-- PRD section 8.2.
create type urgency_level as enum (
  'critical',
  'urgent',
  'support_needed',
  'adoption_community'
);

-- PRD sections 9.1 (primary) and 9.2 (exceptional) combined into one
-- status domain, since a case is always in exactly one of them.
create type case_status as enum (
  'draft',
  'submitted',
  'under_review',
  'open',
  'response_committed',
  'responder_en_route',
  'animal_located',
  'rescue_in_progress',
  'transporting',
  'at_clinic_foster_shelter',
  'follow_up_required',
  'resolved',
  'closed',
  'no_longer_found',
  'duplicate',
  'false_report',
  'spam',
  'unsafe_or_prohibited_content',
  'cancelled_by_reporter',
  'closed_by_moderator'
);

-- PRD section 9.3.
create type closure_outcome as enum (
  'successfully_rescued',
  'treated_and_returned_safely',
  'transferred_to_veterinary_care',
  'transferred_to_organization',
  'moved_to_temporary_foster',
  'moved_to_shelter',
  'adopted',
  'recovered_without_intervention',
  'could_not_be_found',
  'duplicate_report',
  'report_inaccurate',
  'died_before_help_arrived',
  'died_during_or_after_treatment',
  'other_documented_outcome'
);

-- Controls exact-location access beyond the confirmed default policy
-- (accepted responders, coordinator, moderators). "restricted" tightens
-- this to moderators and the coordinator only, for abuse/theft-risk
-- cases per PRD 12.2 and MOD-010.
create type case_location_sensitivity as enum (
  'standard',
  'restricted'
);

-- PRD section 13.1.
create type contribution_category as enum (
  'on_site_responder',
  'transport_volunteer',
  'foster_provider',
  'veterinary_support',
  'case_coordinator',
  'organization_responder',
  'adoption_facilitator',
  'moderator_contribution'
);

-- PRD section 10.13, MOD-002.
create type report_reason as enum (
  'spam',
  'duplicate',
  'fraud',
  'cruelty',
  'graphic_content',
  'unsafe_advice',
  'harassment',
  'privacy_exposure',
  'other'
);

create type report_target_type as enum (
  'case',
  'comment',
  'profile',
  'media'
);

create type moderation_action_type as enum (
  'hide_content',
  'merge_duplicate',
  'redact_personal_info',
  'warn_account',
  'restrict_account',
  'suspend_account',
  'ban_account',
  'reopen_case',
  'correct_status',
  'other'
);

create type account_restriction_type as enum (
  'warning',
  'restricted',
  'suspended',
  'banned'
);

create type response_commitment_status as enum (
  'committed',
  'confirmed',
  'completed',
  'declined',
  'unresponsive',
  'withdrawn'
);

-- Free-form assistance types a responder can commit to. Kept as an
-- enum used in an array column (case_responses.assistance_types)
-- rather than a join table, since the set is small and stable.
create type assistance_type as enum (
  'on_site_rescue',
  'transport',
  'veterinary_treatment',
  'temporary_foster',
  'shelter_coordination',
  'case_coordination',
  'financial_support'
);
