
-- Additional enums needed for identity tables, kept in this migration
-- since they only apply here.
create type volunteer_capability_type as enum (
  'on_site_rescue',
  'transport',
  'veterinary_professional',
  'veterinary_assistant',
  'temporary_foster',
  'shelter_coordination',
  'adoption_support',
  'case_coordination',
  'financial_support_interest'
);

create type app_language as enum ('bn', 'en');

-- Animal types are an explicit open question in the PRD (open question 3)
-- and are meant to be admin-configurable, so they are a reference table
-- rather than a hardcoded enum.
create table animal_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_en text not null,
  label_bn text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table animal_types is 'Admin-configurable list of animal types selectable on cases and preferences.';

-- One row per Supabase Auth user. Public-facing profile fields only;
-- private contact details live in user_private_details.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  city text,
  area text,
  preferred_language app_language not null default 'en',
  bio text,
  avatar_url text,
  role app_role not null default 'registered_user',
  is_suspended boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Public profile data. AUTH-009: is_suspended blocks case creation, response, and comments at the RLS layer.';

-- Private contact and consent data. Never joined into public-facing
-- views. PROF-005: phone is private by default.
create table user_private_details (
  user_id uuid primary key references profiles(id) on delete cascade,
  email text not null,
  phone_normalized text,
  phone_verified boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_notice_accepted_at timestamptz,
  location_policy_accepted_at timestamptz,
  community_rules_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_normalized_format check (
    phone_normalized is null or phone_normalized ~ '^\+8801[0-9]{9}$'
  )
);

comment on table user_private_details is 'AUTH-002: phone stored as +8801XXXXXXXXX. Owner and narrowly authorized functions only.';

create table user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table user_devices is 'ALERT-010: invalid or expired tokens are marked is_active = false, not deleted, to preserve delivery history.';

-- Unique active token per device - a token should only ever be
-- registered to one active row at a time.
create unique index user_devices_active_token_idx
  on user_devices (expo_push_token)
  where is_active;

create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  alert_radius_km numeric(6, 2) not null default 5,
  min_urgency urgency_level not null default 'support_needed',
  quiet_hours_start time,
  quiet_hours_end time,
  critical_override boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint alert_radius_positive check (alert_radius_km > 0)
);

comment on table notification_preferences is 'ALERT-002, ALERT-009. min_urgency is the least-urgent level this user wants alerted about.';

create table user_preferred_animal_types (
  user_id uuid not null references profiles(id) on delete cascade,
  animal_type_id uuid not null references animal_types(id) on delete cascade,
  primary key (user_id, animal_type_id)
);

create table volunteer_capabilities (
  user_id uuid not null references profiles(id) on delete cascade,
  capability volunteer_capability_type not null,
  primary key (user_id, capability)
);

comment on table volunteer_capabilities is 'PROF-002, PRD 7.1 step 5.';

create table user_availability (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_available boolean not null default true,
  notes text,
  updated_at timestamptz not null default now()
);

comment on table user_availability is 'PROF-003: availability only, never live location.';
