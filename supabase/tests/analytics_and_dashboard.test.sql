-- Part 20: analytics_events, record_analytics_event(), and
-- get_operational_dashboard_signals(). Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

insert into animal_types (slug, label_en, label_bn) values ('dog', 'Dog', 'kukur') on conflict do nothing;

\o /dev/null
select pg_temp.mk_user('alice');
select pg_temp.mk_user('mod');
update profiles set role = 'moderator' where id = pg_temp.uid('mod');
\o

-- 1. A plain authenticated user can record their own event, but can
-- never read any row back, including their own - no select policy
-- grants that; only get_operational_dashboard_signals() aggregates.
do $$
declare v_alice uuid := pg_temp.uid('alice');
begin
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  set local role authenticated;
  perform record_analytics_event('report_submitted', jsonb_build_object('incident_type', 'injured_animal'));
  reset role;

  assert (select count(*) from analytics_events where user_id = v_alice) = 1,
    'the insert must have been recorded against the caller (checked outside RLS)';

  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  set local role authenticated;
  assert (select count(*) from analytics_events) = 0,
    'a plain user must not be able to read back any analytics_events row, including their own';
  reset role;
end $$;

-- 2. anon may record an event (e.g. a failed registration attempt)
-- only with a null user_id - never claiming someone else's identity.
do $$
begin
  set local role anon;
  perform record_analytics_event('registration_completed');
  reset role;
  assert (select count(*) from analytics_events where user_id is null and event_name = 'registration_completed') = 1;
end $$;

-- 3. A moderator can read the aggregate signals; a plain user gets no
-- row at all (not an error, not fabricated zeros - the where clause
-- inside the function excludes the row entirely for a non-moderator).
do $$
declare
  v_alice uuid := pg_temp.uid('alice');
  v_mod uuid := pg_temp.uid('mod');
  v_row record;
  v_count int;
begin
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  set local role authenticated;
  select count(*) into v_count from get_operational_dashboard_signals();
  reset role;
  assert v_count = 0, 'a plain user must get no row from the dashboard signal function';

  perform set_config('request.jwt.claim.sub', v_mod::text, true);
  set local role authenticated;
  select * into v_row from get_operational_dashboard_signals();
  reset role;
  assert v_row.open_moderation_reports is not null, 'a moderator must get a signals row';

  assert not has_function_privilege('anon', 'get_operational_dashboard_signals()', 'execute');
end $$;

-- 4. Upload-failure signal reflects analytics_events, not a guess.
do $$
declare
  v_alice uuid := pg_temp.uid('alice');
  v_mod uuid := pg_temp.uid('mod');
  v_before bigint;
  v_after bigint;
begin
  perform set_config('request.jwt.claim.sub', v_mod::text, true);
  set local role authenticated;
  select upload_failures_24h into v_before from get_operational_dashboard_signals();
  reset role;

  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  set local role authenticated;
  perform record_analytics_event('report_upload_failed');
  reset role;

  perform set_config('request.jwt.claim.sub', v_mod::text, true);
  set local role authenticated;
  select upload_failures_24h into v_after from get_operational_dashboard_signals();
  reset role;

  assert v_after = v_before + 1, 'a new report_upload_failed event must increment the 24h signal';
end $$;
