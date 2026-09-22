
create type organization_type as enum (
  'clinic',
  'shelter',
  'ngo',
  'rescue_group',
  'individual_coordinator'
);

create type verification_status as enum (
  'pending',
  'verified',
  'rejected'
);

create type organization_member_role as enum (
  'member',
  'administrator'
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type organization_type not null,
  verification_status verification_status not null default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  service_area text,
  contact_method text,
  description text,
  last_confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table organizations is 'ORG-001, ORG-002: verification_status moves pending -> verified/rejected only via a moderator or administrator.';

-- ORG-005: named member accounts, shared credentials prohibited.
create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role organization_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table organization_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ORG-004: explicit opt-in required, no automatic dispatch.
create table organization_availability (
  organization_id uuid primary key references organizations(id) on delete cascade,
  is_currently_available boolean not null default true,
  hours_text text,
  opted_in_urgency_levels urgency_level[] not null default '{}',
  opted_in_incident_types incident_type[] not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table organization_availability is 'ORG-004: an organization receives dispatch only for urgency levels and incident types listed here.';

create table clinics (
  organization_id uuid primary key references organizations(id) on delete cascade,
  specializations text,
  emergency_capable boolean not null default false
);

create table shelters (
  organization_id uuid primary key references organizations(id) on delete cascade,
  capacity_total integer,
  capacity_available integer,
  constraint capacity_available_within_total check (
    capacity_available is null or capacity_total is null or capacity_available <= capacity_total
  )
);

-- Fosters are individual volunteers, not necessarily verified
-- organizations, per PRD 5.4.
create table foster_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  capacity integer not null default 1,
  area text,
  available_from date,
  available_until date,
  limitations text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table foster_supported_animal_types (
  foster_profile_id uuid not null references foster_profiles(id) on delete cascade,
  animal_type_id uuid not null references animal_types(id) on delete cascade,
  primary key (foster_profile_id, animal_type_id)
);
