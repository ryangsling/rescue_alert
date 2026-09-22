
create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid not null references rescue_cases(id) on delete cascade,
  category contribution_category not null,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, case_id, category)
);

comment on table contributions is 'PRD 13.2: verified_by/verified_at set only by an authorized confirmer (creator, coordinator, org, or moderator) - a contribution is unverified rescue history until then.';

create table achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_en text not null,
  label_bn text not null,
  description_en text,
  description_bn text,
  created_at timestamptz not null default now()
);

comment on table achievements is 'PRD 13.3: badges tied to verified contribution milestones. No public leaderboard is ever built from this table.';

create table user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id),
  target_type report_target_type not null,
  target_id uuid not null,
  reason report_reason not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

comment on table content_reports is 'MOD-001, MOD-002. target_id is polymorphic against target_type - no FK constraint, resolved in application code.';

create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references profiles(id),
  action_type moderation_action_type not null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

comment on table moderation_actions is 'MOD-007: every moderation action is audited here. reason is required, not optional.';

create table account_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  restriction_type account_restriction_type not null,
  reason text not null,
  issued_by uuid not null references profiles(id),
  issued_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by uuid references profiles(id)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

comment on table audit_logs is 'General-purpose audit trail for privileged operations not already covered by case_status_history or moderation_actions (e.g. role changes, organization verification).';
