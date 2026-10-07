-- Shared temp-schema helpers for the SQL tests. Loaded with \i from each
-- *.test.sql file; everything lives in the test session only.

create temp table names (name text primary key, id uuid not null);

-- Case point. Digits past the third decimal are what the server-derived
-- approximate point discards, so they must never appear in a payload.
create function pg_temp.case_point() returns geography language sql as
  $$ select st_setsrid(st_makepoint(90.374234, 23.746123), 4326)::geography $$;

create function pg_temp.uid(p_name text) returns uuid language sql as
  $$ select id from names where name = p_name $$;

create function pg_temp.mk_user(p_name text) returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data) values (
    v, p_name || '_' || v || '@test.local',
    jsonb_build_object(
      'full_name', p_name, 'phone_normalized', '+8801711223344',
      'terms_accepted', true, 'privacy_notice_accepted', true,
      'location_policy_accepted', true, 'community_rules_accepted', true
    )
  );
  insert into names values (p_name, v);
  return v;
end $$;

-- A volunteer with a base point p_dist_m north of the case point.
create function pg_temp.mk_vol(
  p_name text,
  p_dist_m double precision,
  p_caps volunteer_capability_type[] default array['on_site_rescue']::volunteer_capability_type[],
  p_radius numeric default 10,
  p_min_urgency urgency_level default 'support_needed'
) returns uuid language plpgsql as $$
declare v uuid := pg_temp.mk_user(p_name);
begin
  insert into notification_preferences (user_id, alert_radius_km, min_urgency, base_location)
  values (v, p_radius, p_min_urgency, st_project(pg_temp.case_point(), p_dist_m, 0)::geography);
  insert into volunteer_capabilities (user_id, capability)
    select v, unnest(p_caps);
  insert into user_devices (user_id, expo_push_token, platform)
  values (v, 'ExponentPushToken[' || p_name || ']', 'android');
  return v;
end $$;

-- Creates a case through the real create_case path, as the creator.
create function pg_temp.mk_case(
  p_creator uuid, p_urgency urgency_level, p_incident incident_type default 'injured_animal',
  p_animal uuid default null
) returns uuid language plpgsql as $$
declare v_case rescue_cases;
begin
  perform set_config('request.jwt.claim.sub', p_creator::text, true);
  set local role authenticated;
  v_case := create_case(
    gen_random_uuid()::text, p_incident, p_urgency, p_animal, 'test case',
    pg_temp.case_point(), 'near the test lake', 'Dhaka', 'Dhaka', 'Dhanmondi', true
  );
  reset role;
  return v_case.id;
end $$;

-- Pretend the case has been open for p_minutes.
create function pg_temp.age_case(p_case uuid, p_minutes integer) returns void language sql as $$
  update case_status_history
  set created_at = now() - make_interval(mins => p_minutes)
  where case_id = p_case and new_status = 'open';
$$;

create function pg_temp.names_of(p_ids uuid[]) returns text language sql as $$
  select coalesce(string_agg(n.name, ',' order by n.name), '')
  from names n where n.id = any(p_ids);
$$;

-- Runs p_sql as p_actor (authenticated), per the Part 12 trigger's
-- requirement that case_responses writes come from auth.uid() itself.
create procedure pg_temp.as_user(p_actor uuid, p_sql text) language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_actor::text, true);
  execute 'set local role authenticated';
  execute p_sql;
  execute 'reset role';
end $$;

-- Commits a response to a case as p_responder, returning its id.
create function pg_temp.mk_response(
  p_case uuid, p_responder uuid, p_types assistance_type[] default array['on_site_rescue']::assistance_type[]
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  perform set_config('request.jwt.claim.sub', p_responder::text, true);
  set local role authenticated;
  insert into case_responses (case_id, responder_id, assistance_types)
    values (p_case, p_responder, p_types)
    returning id into v_id;
  reset role;
  return v_id;
end $$;
