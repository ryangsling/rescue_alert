-- Part 11 tests: matching, dispatch, deduplication, stop conditions,
-- quiet hours, token cleanup, payload safety, failure isolation, access.
-- Run via supabase/tests/run.sh. Any failed assert aborts the run.

\i supabase/tests/helpers.sql

insert into animal_types (slug, label_en, label_bn) values ('dog', 'Dog', 'kukur'), ('cat', 'Cat', 'biral') on conflict do nothing;

\o /dev/null
select pg_temp.mk_user('creator');

-- Volunteers at known distances. Distances are measured to the rounded
-- (3 decimal) approximate point, so bands are kept well clear of edges.
select pg_temp.mk_vol('a_ok_1km', 1000);
select pg_temp.mk_vol('b_wrong_capability', 1000, array['transport']::volunteer_capability_type[]);
select pg_temp.mk_vol('c_unavailable', 1000);
select pg_temp.mk_vol('d_prefers_cats', 1000);
select pg_temp.mk_vol('e_own_radius_0_5km', 1000, p_radius => 0.5);
select pg_temp.mk_vol('f_suspended', 1000);
select pg_temp.mk_vol('g_ok_1km_critical_only', 1000, p_min_urgency => 'critical');
select pg_temp.mk_vol('h_restricted', 1000);
select pg_temp.mk_vol('i_ok_3km', 3000);
select pg_temp.mk_vol('j_ok_7km', 7000);
select pg_temp.mk_vol('k_ok_15km', 15000, p_radius => 25);
select pg_temp.mk_vol('l_committed', 1000);
select pg_temp.mk_vol('m_far_30km', 30000, p_radius => 50);

insert into user_availability (user_id, is_available)
  select pg_temp.uid('c_unavailable'), false
  on conflict (user_id) do update set is_available = false;
insert into user_preferred_animal_types (user_id, animal_type_id)
  select pg_temp.uid('d_prefers_cats'), id from animal_types where slug = 'cat';
update profiles set is_suspended = true where id = pg_temp.uid('f_suspended');
insert into account_restrictions (user_id, restriction_type, reason, issued_by)
  values (pg_temp.uid('h_restricted'), 'restricted', 'test', pg_temp.uid('creator'));
\o

-- 1. Matching returns exactly the expected volunteers per radius.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical', 'injured_animal',
    (select id from animal_types where slug = 'dog'));
  v_got text;
begin
  perform pg_temp.mk_response(v_case, pg_temp.uid('l_committed'));

  select pg_temp.names_of(array_agg(user_id)) into v_got from find_alert_candidates(v_case, 2);
  assert v_got = 'a_ok_1km,g_ok_1km_critical_only', 'radius 2: got ' || v_got;

  select pg_temp.names_of(array_agg(user_id)) into v_got from find_alert_candidates(v_case, 5);
  assert v_got = 'a_ok_1km,g_ok_1km_critical_only,i_ok_3km', 'radius 5: got ' || v_got;

  select pg_temp.names_of(array_agg(user_id)) into v_got from find_alert_candidates(v_case, 10);
  assert v_got = 'a_ok_1km,g_ok_1km_critical_only,i_ok_3km,j_ok_7km', 'radius 10: got ' || v_got;

  select pg_temp.names_of(array_agg(user_id)) into v_got from find_alert_candidates(v_case, 20);
  assert v_got = 'a_ok_1km,g_ok_1km_critical_only,i_ok_3km,j_ok_7km,k_ok_15km', 'radius 20: got ' || v_got;

  -- distance shown to the volunteer is rounded to 0.1 km
  assert (select distance_km from find_alert_candidates(v_case, 2) where user_id = pg_temp.uid('a_ok_1km'))
    between 0.9 and 1.1, 'distance not ~1.0 km';
end $$;

-- min_urgency: an urgent case skips the volunteer who wants critical only.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_got text;
begin
  select pg_temp.names_of(array_agg(user_id)) into v_got from find_alert_candidates(v_case, 5);
  assert v_got = 'a_ok_1km,d_prefers_cats,i_ok_3km,l_committed', 'urgent radius 5: got ' || v_got;
end $$;

-- 2. Dispatcher run twice sends no duplicate initial alerts, and radius
-- expansion reaches only newly in-range volunteers with the expanded category.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  v_first integer;
begin
  v_first := dispatch_case_alerts(v_case);
  -- a, d (case has no animal type, so animal preference cannot exclude), g, l
  assert v_first = 4, 'step 1 alerts four volunteers, got ' || v_first;
  assert dispatch_case_alerts(v_case) = 0, 'second run must insert nothing';

  perform pg_temp.age_case(v_case, 15);
  assert dispatch_case_alerts(v_case) = 1, 'step 2 alerts only i_ok_3km';
  assert (select category from notifications
          where case_id = v_case and recipient_id = pg_temp.uid('i_ok_3km')) = 'radius_expanded_case';
  assert (select category from notifications
          where case_id = v_case and recipient_id = pg_temp.uid('a_ok_1km')) = 'new_critical_case_nearby';

  perform pg_temp.age_case(v_case, 45);
  perform dispatch_case_alerts(v_case);
  assert exists (select 1 from notifications where case_id = v_case and recipient_id = pg_temp.uid('k_ok_15km')),
    'step 4 reaches 15 km';
  assert not exists (select 1 from notifications where case_id = v_case and recipient_id = pg_temp.uid('m_far_30km')),
    '30 km is outside every step';

  assert not exists (
    select 1 from notifications
    where case_id = v_case and category in ('new_critical_case_nearby','new_urgent_case_nearby','radius_expanded_case')
    group by recipient_id having count(*) > 1
  ), 'no volunteer may hold two nearby alerts for one case';
end $$;

-- 3a. Expansion stops when adequate assistance is committed.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
begin
  assert dispatch_case_alerts(v_case) > 0;
  perform pg_temp.mk_response(v_case, pg_temp.uid('a_ok_1km'));
  perform pg_temp.age_case(v_case, 45);
  assert dispatch_case_alerts(v_case) = 0, 'no expansion once assistance is committed';
end $$;

-- 3b. ...but not while a need on the board is still unfulfilled.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
begin
  perform dispatch_case_alerts(v_case);
  perform pg_temp.mk_response(v_case, pg_temp.uid('a_ok_1km'));
  insert into case_needs (case_id, need_type) values (v_case, 'transport');
  perform pg_temp.age_case(v_case, 15);
  assert dispatch_case_alerts(v_case) = 1, 'expansion continues while a need is unfulfilled';
end $$;

-- 3c. Expansion stops when the case closes (asserted separately).
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
begin
  perform dispatch_case_alerts(v_case);
  update rescue_cases set status = 'closed' where id = v_case;
  perform pg_temp.age_case(v_case, 45);
  assert dispatch_case_alerts(v_case) = 0, 'no expansion after closure';
  assert not case_needs_alerts(v_case);
end $$;

-- 4. Quiet hours: suppressed unless the critical override is on.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  v_now time := (now() at time zone 'Asia/Dhaka')::time;
  v_urgent uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
begin
  perform pg_temp.mk_vol('n_override_1km', 1000);
  assert is_in_quiet_hours('22:00', '07:00', timestamptz '2026-01-01 20:00:00+00'), '02:00 Dhaka is inside 22-07';
  assert not is_in_quiet_hours('22:00', '07:00', timestamptz '2026-01-01 08:00:00+00'), '14:00 Dhaka is outside 22-07';
  assert is_in_quiet_hours('13:00', '15:00', timestamptz '2026-01-01 08:00:00+00'), '14:00 Dhaka is inside 13-15';
  assert not is_in_quiet_hours(null, null);

  update notification_preferences
  set quiet_hours_start = v_now - interval '1 hour', quiet_hours_end = v_now + interval '1 hour'
  where user_id in (pg_temp.uid('a_ok_1km'), pg_temp.uid('g_ok_1km_critical_only'), pg_temp.uid('n_override_1km'));
  update notification_preferences set critical_override = true
  where user_id in (pg_temp.uid('g_ok_1km_critical_only'), pg_temp.uid('n_override_1km'));

  perform dispatch_case_alerts(v_case);
  perform dispatch_case_alerts(v_urgent);
  perform queue_notification_deliveries();

  assert not exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.recipient_id = pg_temp.uid('a_ok_1km')
  ), 'quiet hours must suppress a user without the override';
  assert exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.recipient_id = pg_temp.uid('g_ok_1km_critical_only') and n.case_id = v_case
  ), 'the override must let a critical alert through';
  assert not exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.recipient_id = pg_temp.uid('n_override_1km') and n.case_id = v_urgent
  ), 'the override applies to critical cases only';
  assert exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.recipient_id = pg_temp.uid('n_override_1km') and n.case_id = v_case
  ), 'the same volunteer still gets the critical alert';

  -- leave quiet hours: the deferred push is now queued
  update notification_preferences set quiet_hours_start = null, quiet_hours_end = null;
  perform queue_notification_deliveries();
  assert exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.recipient_id = pg_temp.uid('a_ok_1km') and n.case_id = v_case
  ), 'deferred push queues once quiet hours end';
end $$;

-- 5. Delivery bookkeeping and invalid token removal.
do $$
declare
  v_ok uuid; v_bad uuid; v_flaky uuid;
  v_claimed integer;
begin
  select count(*) into v_claimed from claim_pending_deliveries(1000);
  assert v_claimed > 0;
  assert not exists (select 1 from claim_pending_deliveries(1000)), 'a claimed delivery is not handed out twice';

  select d.id into v_ok from notification_deliveries d join user_devices dev on dev.id = d.device_id
    where dev.expo_push_token = 'ExponentPushToken[a_ok_1km]' limit 1;
  select d.id into v_bad from notification_deliveries d join user_devices dev on dev.id = d.device_id
    where dev.expo_push_token = 'ExponentPushToken[g_ok_1km_critical_only]' limit 1;
  select d.id into v_flaky from notification_deliveries d join user_devices dev on dev.id = d.device_id
    where dev.expo_push_token = 'ExponentPushToken[i_ok_3km]' limit 1;

  perform record_delivery_results(jsonb_build_array(
    jsonb_build_object('delivery_id', v_ok, 'ticket_id', 'ticket-1'),
    jsonb_build_object('delivery_id', v_bad, 'error', 'DeviceNotRegistered'),
    jsonb_build_object('delivery_id', v_flaky, 'error', 'MessageRateExceeded')
  ));

  assert (select status from notification_deliveries where id = v_ok) = 'accepted';
  assert (select status from notification_deliveries where id = v_bad) = 'token_invalid';
  assert not (select is_active from user_devices where expo_push_token = 'ExponentPushToken[g_ok_1km_critical_only]'),
    'a rejected token must be deactivated';
  assert (select status from notification_deliveries where id = v_flaky) = 'pending', 'transient error is retried';

  -- third failed attempt gives up
  update notification_deliveries set attempts = 3 where id = v_flaky;
  perform record_delivery_results(jsonb_build_array(
    jsonb_build_object('delivery_id', v_flaky, 'error', 'MessageRateExceeded')
  ));
  assert (select status from notification_deliveries where id = v_flaky) = 'failed';

  -- receipts: not checked before five minutes; a bad receipt retires the token
  assert not exists (select 1 from claim_receipt_checks(10)), 'receipts wait five minutes';
  update notification_deliveries set attempted_at = now() - interval '10 minutes' where id = v_ok;
  assert exists (select 1 from claim_receipt_checks(10) where delivery_id = v_ok);
  perform record_receipt_results(jsonb_build_array(
    jsonb_build_object('delivery_id', v_ok, 'ok', false, 'error', 'DeviceNotRegistered')
  ));
  assert (select status from notification_deliveries where id = v_ok) = 'token_invalid';
  assert not (select is_active from user_devices where expo_push_token = 'ExponentPushToken[a_ok_1km]');
  assert not exists (select 1 from claim_receipt_checks(10) where delivery_id = v_ok), 'each receipt is checked once';
end $$;

-- 6. Payloads carry no exact coordinate and no phone number.
do $$
declare v_bad integer;
begin
  select count(*) into v_bad from notifications
  where category in ('new_critical_case_nearby', 'new_urgent_case_nearby', 'radius_expanded_case')
    and (payload::text ~ '(23\.7461|90\.3742|\+8801|01711)'
      or (select array_agg(k order by k) from jsonb_object_keys(payload) k)
         <> array['area', 'distance_km', 'incident_type', 'urgency']);
  assert v_bad = 0, v_bad || ' notification payloads carry unexpected or sensitive data';
end $$;

-- 7. A forced notification failure leaves the created case intact.
do $$
declare v_case uuid;
begin
  alter table notifications add constraint force_failure check (false) not valid;
  v_case := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  assert exists (select 1 from rescue_cases where id = v_case and status = 'open'), 'case must exist and be open';
  begin
    perform dispatch_case_alerts(v_case);
    assert false, 'dispatch should have failed under the forced constraint';
  exception when check_violation then null;
  end;
  assert exists (select 1 from rescue_cases where id = v_case and status = 'open'), 'case survives a failed dispatch';
  alter table notifications drop constraint force_failure;
end $$;

-- 8. Access control.
do $$
declare v_j uuid := pg_temp.uid('j_ok_7km'); v_mod uuid := pg_temp.mk_user('escalation_mod');
begin
  update profiles set role = 'moderator' where id = v_mod;

  perform set_config('request.jwt.claim.sub', v_j::text, true);
  set local role authenticated;
  assert (select count(*) from notifications where recipient_id <> v_j) = 0,
    'a user must not read other users notifications';
  begin
    insert into notifications (recipient_id, category) values (v_j, 'case_closed');
    assert false, 'clients must not insert notifications';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from notification_deliveries;
    assert false, 'clients must not read deliveries';
  exception when insufficient_privilege then null;
  end;
  -- Part 15: moderators/administrators may read the escalation ladder
  -- (PRD 24 "configurable alert radii"); an ordinary user still reads
  -- zero rows via RLS, same effective guarantee as before.
  assert (select count(*) from alert_escalation_steps) = 0,
    'a non-moderator must not read escalation config';
  reset role;

  perform set_config('request.jwt.claim.sub', v_mod::text, true);
  set local role authenticated;
  assert (select count(*) from alert_escalation_steps) > 0,
    'a moderator may read escalation config';
  update alert_escalation_steps set radius_km = 999 where urgency = 'critical' and step = 1;
  assert (select count(*) from alert_escalation_steps where radius_km = 999) = 0,
    'a plain moderator must not write escalation config';
  reset role;

  assert not has_function_privilege('authenticated', 'find_alert_candidates(uuid,numeric)', 'execute');
  assert not has_function_privilege('anon', 'dispatch_all_case_alerts()', 'execute');
  assert not has_function_privilege('authenticated', 'claim_pending_deliveries(integer)', 'execute');
  assert has_function_privilege('service_role', 'dispatch_all_case_alerts()', 'execute');
  assert not has_function_privilege('anon', 'register_device(text,text)', 'execute');
end $$;

-- 9. Device registration moves tokens between accounts safely.
do $$
declare
  v_a uuid := pg_temp.uid('creator'); v_b uuid := pg_temp.uid('j_ok_7km');
begin
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  set local role authenticated;
  perform register_device('ExponentPushToken[shared]', 'android');
  perform register_device('ExponentPushToken[shared]', 'android');
  reset role;
  assert (select count(*) from user_devices where expo_push_token = 'ExponentPushToken[shared]') = 1,
    're-registering the same token is a refresh, not a duplicate';

  perform set_config('request.jwt.claim.sub', v_b::text, true);
  set local role authenticated;
  perform register_device('ExponentPushToken[shared]', 'android');
  begin
    perform register_device('not-a-token', 'android');
    assert false, 'malformed token must be rejected';
  exception when invalid_parameter_value then null;
  end;
  reset role;
  assert (select user_id from user_devices where expo_push_token = 'ExponentPushToken[shared]' and is_active) = v_b;
  assert not (select is_active from user_devices where user_id = v_a and expo_push_token = 'ExponentPushToken[shared]');

  perform set_config('request.jwt.claim.sub', v_b::text, true);
  set local role authenticated;
  perform unregister_device('ExponentPushToken[shared]');
  reset role;
  assert not exists (select 1 from user_devices where expo_push_token = 'ExponentPushToken[shared]' and is_active);
end $$;

-- 10. Matching is executed by PostGIS through the GiST index (plan
-- inspection). Runs the same join shape as find_alert_candidates over a
-- realistic volume, with default planner settings.
do $$
declare
  r record; v_plan text := '';
begin
  insert into auth.users (id, email, raw_user_meta_data)
  select gen_random_uuid(), 'bulk' || g || '@test.local',
    jsonb_build_object('full_name', 'bulk' || g, 'terms_accepted', true,
      'privacy_notice_accepted', true, 'location_policy_accepted', true,
      'community_rules_accepted', true)
  from generate_series(1, 20000) g;

  insert into notification_preferences (user_id, base_location)
  select p.id, st_setsrid(st_makepoint(90.0 + random() * 0.8, 23.4 + random() * 0.8), 4326)::geography
  from profiles p where p.full_name like 'bulk%';

  analyze notification_preferences;

  for r in execute format(
    'explain select np.user_id from notification_preferences np
     where st_dwithin(np.base_location, %L::geography, 2000)', pg_temp.case_point()::text)
  loop
    v_plan := v_plan || r."QUERY PLAN" || E'\n';
  end loop;

  assert v_plan like '%notification_preferences_base_location_idx%', 'expected a GiST index scan, got: ' || v_plan;
  assert v_plan not like '%Seq Scan%', 'must not scan every user: ' || v_plan;
end $$;

-- 11. Matching uses the approximate point, never the exact one. The
-- approximate point sits ~28 m south-west of the exact one, so a
-- volunteer 1990 m north of the exact point is inside 2 km of the exact
-- coordinate but outside 2 km of the approximate one.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  v_edge uuid;
begin
  v_edge := pg_temp.mk_vol('o_edge_1990m', 1990);
  assert not exists (select 1 from find_alert_candidates(v_case, 2) where user_id = v_edge),
    'exact coordinate must not influence who is matched';
  assert exists (select 1 from find_alert_candidates(v_case, 5) where user_id = v_edge);
end $$;
