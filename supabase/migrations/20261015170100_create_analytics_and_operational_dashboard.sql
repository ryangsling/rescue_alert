-- Part 20: PRD section 23 (analytics and observability).
--
-- analytics_events is a minimal, privacy-conscious operational event
-- log - PRD section 23's own list is explicitly operational events
-- (registration completed, report submitted, notification opened,
-- etc.), never continuous movement histories or free-text content.
-- event_name is a closed enum, not free text, so a client can never
-- log an arbitrary string; properties is a small jsonb bag for the
-- few structured fields each event needs (never a coordinate, a
-- phone number, or message content).
create type analytics_event_name as enum (
  'registration_completed',
  'onboarding_completed',
  'notification_permission_result',
  'report_draft_created',
  'report_submitted',
  'report_upload_failed',
  'nearby_alert_generated',
  'notification_opened',
  'response_committed',
  'responder_withdrew',
  'animal_located',
  'case_status_changed',
  'case_closed',
  'outcome_recorded',
  'content_reported',
  'moderation_action_completed'
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name analytics_event_name not null,
  -- Nullable: some events (e.g. a failed registration attempt) have
  -- no authenticated actor yet. Never a case's exact location or any
  -- free-text field - see the comment above.
  user_id uuid references profiles(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table analytics_events is 'PRD section 23. Operational events only - insert-only for clients (their own user_id), readable only by moderators/administrators for the operational dashboard.';

create index analytics_events_event_name_created_at_idx
  on analytics_events (event_name, created_at desc);

alter table analytics_events enable row level security;

-- Insert-only, and only as yourself (or anonymously, for pre-auth
-- events like a failed registration) - never on another user's
-- behalf. No client-side select policy: the operational dashboard
-- reads through get_operational_dashboard_signals() below instead, so
-- a client can never read back arbitrary analytics_events rows.
create policy analytics_events_insert on analytics_events
  for insert to authenticated, anon
  with check (user_id is null or user_id = auth.uid());

create policy analytics_events_select_moderator on analytics_events
  for select to authenticated
  using (is_moderator_or_admin());

create or replace function record_analytics_event(
  p_event_name analytics_event_name,
  p_properties jsonb default '{}'::jsonb
) returns void
language sql
set search_path = public
as $$
  insert into analytics_events (event_name, user_id, properties)
  values (p_event_name, auth.uid(), coalesce(p_properties, '{}'::jsonb));
$$;

revoke execute on function record_analytics_event(analytics_event_name, jsonb) from public;
grant execute on function record_analytics_event(analytics_event_name, jsonb) to authenticated, anon;

-- PRD section 23's operational-dashboard signals. Two of the seven are
-- deliberately not covered here and return null, disclosed rather
-- than faked: "database and function errors" needs a log drain (a new
-- third-party service decision, out of scope for this pass), and
-- "suspicious report spikes" has no agreed spike-detection threshold
-- yet - this returns the raw last-24h count so a moderator can judge
-- it themselves rather than trusting an invented formula.
create or replace function get_operational_dashboard_signals()
returns table (
  active_cases bigint,
  unanswered_critical_cases bigint,
  notification_failures_24h bigint,
  upload_failures_24h bigint,
  open_moderation_reports bigint,
  content_reports_24h bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from rescue_cases
       where status in ('open', 'response_committed', 'responder_en_route',
                         'animal_located', 'rescue_in_progress', 'transporting',
                         'at_clinic_foster_shelter', 'follow_up_required')),
    (select count(*) from rescue_cases
       where urgency in ('critical', 'urgent') and status = 'open'),
    (select count(*) from notification_deliveries
       where status = 'failed' and attempted_at > now() - interval '24 hours'),
    (select count(*) from analytics_events
       where event_name = 'report_upload_failed' and created_at > now() - interval '24 hours'),
    (select count(*) from content_reports where status = 'open'),
    (select count(*) from content_reports where created_at > now() - interval '24 hours')
  where is_moderator_or_admin();
$$;

revoke execute on function get_operational_dashboard_signals() from public, anon;
grant execute on function get_operational_dashboard_signals() to authenticated;
