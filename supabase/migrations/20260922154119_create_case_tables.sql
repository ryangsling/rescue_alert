
create or replace function generate_public_reference() returns text
language sql volatile as $$
  select 'RA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

-- PRD 18.2 field list, with animal_type as a lookup FK (see
-- animal_types comment) and closure detail split into rescue_outcomes.
create table rescue_cases (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id),
  public_reference text not null unique default generate_public_reference(),
  incident_type incident_type not null,
  animal_type_id uuid references animal_types(id),
  urgency urgency_level not null,
  status case_status not null default 'draft',
  title text not null,
  description text,
  location geography(point, 4326),
  approximate_location geography(point, 4326),
  division text,
  district text,
  upazila_or_thana text,
  landmark text,
  reported_at timestamptz not null default now(),
  last_seen_at timestamptz,
  creator_on_site boolean not null default true,
  exact_location_visibility case_location_sensitivity not null default 'standard',
  coordinator_id uuid references profiles(id),
  organization_id uuid references organizations(id),
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closure_reason text
);

comment on table rescue_cases is 'PRD 18.2. location is the exact operational coordinate; approximate_location is server-derived (see derive_approximate_location) and is the only one ever shown to a general signed-in user.';

-- Location edit history, satisfying CASE-010 for the location fields
-- specifically. One row per correction, most recent = current.
create table rescue_case_locations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  location geography(point, 4326),
  approximate_location geography(point, 4326),
  landmark text,
  division text,
  district text,
  upazila_or_thana text,
  changed_by uuid not null references profiles(id),
  change_reason text,
  created_at timestamptz not null default now()
);

create table case_status_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  actor_id uuid references profiles(id),
  previous_status case_status,
  new_status case_status not null,
  reason text,
  created_at timestamptz not null default now()
);

comment on table case_status_history is 'Written only by the transition_case_status() function - never directly. Every status change is captured here per PRD section 9.3 closing line.';

create table case_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  responder_id uuid not null references profiles(id),
  assistance_types assistance_type[] not null,
  eta_at timestamptz,
  availability_note text,
  status response_commitment_status not null default 'committed',
  withdrawal_reason text,
  confirmed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistance_types_not_empty check (array_length(assistance_types, 1) > 0)
);

comment on table case_responses is 'RESP-001..008. A case may have many responses; RESP-005 allows multiple responders with distinct responsibilities.';

create table case_needs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  need_type assistance_type not null,
  is_fulfilled boolean not null default false,
  fulfilled_by_response_id uuid references case_responses(id),
  created_at timestamptz not null default now(),
  unique (case_id, need_type)
);

create table case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table case_updates is 'COMM-002, COMM-003: official updates, authored only by creator/coordinator/org member/moderator, visually distinct from case_comments.';

create table case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  is_hidden boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references case_comments(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  is_hidden boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table case_watchers (
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid not null references rescue_cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

-- Every piece of media belongs to a case; update_id/comment_id record
-- which post it was attached through, if any.
create table rescue_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  update_id uuid references case_updates(id),
  comment_id uuid references case_comments(id),
  uploader_id uuid not null references profiles(id),
  storage_path text not null,
  is_graphic boolean not null default false,
  exif_stripped boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table rescue_media is 'CASE-004, CASE-005: storage_path points into Supabase Storage; exif_stripped must be true before a path is ever exposed publicly.';

create table rescue_outcomes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references rescue_cases(id) on delete cascade,
  outcome closure_outcome not null,
  final_update text not null,
  recorded_by uuid not null references profiles(id),
  follow_up_case_id uuid references rescue_cases(id),
  created_at timestamptz not null default now()
);

comment on table rescue_outcomes is 'OUT-001, OUT-002: one outcome per case. follow_up_case_id links a newly created foster/treatment/adoption case per OUT-007.';
