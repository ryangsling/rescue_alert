-- Part 11: notification storage.
--
-- notifications is the in-app record (what a user sees in their inbox).
-- notification_deliveries is the push attempt log, one row per device.
-- Neither treats a push being accepted by the provider as proof the
-- user saw it (PRD 11.3): "accepted" means only that Expo took it.

create type notification_category as enum (
  'new_critical_case_nearby',
  'new_urgent_case_nearby',
  'radius_expanded_case',
  'response_accepted_or_changed',
  'official_case_update',
  'reply_or_mention',
  'case_status_changed',
  'case_closed',
  'follow_up_requested',
  'moderation_or_account'
);

-- A volunteer's chosen base area for nearby alerts. This is a static
-- point the user picks, never a tracked location (no background
-- location, per the MVP limits). Owner-only via the existing
-- notification_preferences RLS policy.
alter table notification_preferences
  add column base_location geography(point, 4326);

comment on column notification_preferences.base_location is
  'ALERT-003: user-chosen static base point for nearby alerts. Never live or tracked. Null means the user gets no proximity alerts.';

create index notification_preferences_base_location_idx
  on notification_preferences using gist (base_location);

-- Configured radius ladder (ALERT-008). Only critical cases expand;
-- urgent cases are alerted once at their first step. Service-role only.
create table alert_escalation_steps (
  urgency urgency_level not null,
  step smallint not null,
  radius_km numeric(6, 2) not null check (radius_km > 0),
  after_minutes integer not null check (after_minutes >= 0),
  primary key (urgency, step),
  check (urgency in ('critical', 'urgent'))
);

comment on table alert_escalation_steps is
  'ALERT-008. after_minutes is measured from when the case became open. Editing rows changes behaviour with no code change.';

insert into alert_escalation_steps (urgency, step, radius_km, after_minutes) values
  ('critical', 1, 2, 0),
  ('critical', 2, 5, 10),
  ('critical', 3, 10, 20),
  ('critical', 4, 20, 40),
  ('urgent', 1, 5, 0);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  case_id uuid references rescue_cases(id) on delete cascade,
  category notification_category not null,
  step smallint,
  -- Template inputs only (incident type, area, rounded distance). Never
  -- exact coordinates, phone numbers, or foster addresses.
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

comment on column notifications.payload is
  'PRD 11.3: no exact coordinates and no private contact details, ever. Rendered into bn or en text at send time.';

-- ALERT-006: one initial-style alert per volunteer per case, enforced by
-- the database so concurrent dispatcher runs cannot double-send.
create unique index notifications_one_nearby_alert_per_case_idx
  on notifications (recipient_id, case_id)
  where category in (
    'new_critical_case_nearby',
    'new_urgent_case_nearby',
    'radius_expanded_case'
  );

create index notifications_recipient_created_idx
  on notifications (recipient_id, created_at desc);

create index notifications_case_idx on notifications (case_id);

create table notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications(id) on delete cascade,
  device_id uuid not null references user_devices(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'accepted', 'failed', 'token_invalid')),
  attempts smallint not null default 0,
  expo_ticket_id text,
  error_code text,
  attempted_at timestamptz,
  receipt_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (notification_id, device_id)
);

comment on table notification_deliveries is
  'PRD 11.3: records attempts only. accepted = the push service took it; it says nothing about the user seeing it.';

create index notification_deliveries_device_idx on notification_deliveries (device_id);

create index notification_deliveries_open_idx
  on notification_deliveries (created_at)
  where status in ('pending', 'sending');

create index notification_deliveries_receipt_idx
  on notification_deliveries (attempted_at)
  where status = 'accepted' and receipt_checked_at is null;

alter table alert_escalation_steps enable row level security;
alter table notifications enable row level security;
alter table notification_deliveries enable row level security;

-- Users read their own inbox and may only mark rows read.
create policy notifications_recipient_select on notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create policy notifications_recipient_mark_read on notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- The project's default privileges grant everything to anon and
-- authenticated on new tables; narrow that explicitly.
revoke all on notifications from anon, authenticated;
grant select on notifications to authenticated;
grant update (read_at) on notifications to authenticated;

revoke all on alert_escalation_steps from anon, authenticated;
revoke all on notification_deliveries from anon, authenticated;
