\i supabase/tests/helpers.sql

-- 1. An unverified organization never appears in the public
-- directory, and never receives organization alert dispatch even
-- when it has opted into exactly the right urgency/incident type.
do $$
declare
  v_admin uuid := pg_temp.mk_user('org_admin_a');
  v_org uuid;
  v_case uuid;
  v_dir_count int;
  v_candidate_count int;
begin
  call pg_temp.as_user(v_admin, format(
    $q$insert into organizations (id, name, org_type, created_by) values (gen_random_uuid(), 'Unverified Org', 'ngo', %L) returning id$q$,
    v_admin
  ));
  select id into v_org from organizations where name = 'Unverified Org';
  call pg_temp.as_user(v_admin, format(
    $q$insert into organization_members (organization_id, user_id, role) values (%L, %L, 'administrator')$q$,
    v_org, v_admin
  ));
  call pg_temp.as_user(v_admin, format(
    $q$insert into organization_availability (organization_id, is_currently_available, opted_in_urgency_levels, opted_in_incident_types)
       values (%L, true, array['critical']::urgency_level[], array['injured_animal']::incident_type[])$q$,
    v_org
  ));

  v_case := pg_temp.mk_case(pg_temp.mk_user('org_case_creator_a'), 'critical', 'injured_animal');

  select count(*) into v_dir_count from list_verified_directory() where id = v_org;
  assert v_dir_count = 0, 'an unverified organization must never appear in the public directory';

  select count(*) into v_candidate_count from find_org_alert_candidates(v_case) where user_id = v_admin;
  assert v_candidate_count = 0, 'an unverified organization must never receive dispatch';
end $$;

-- 2. A verified, available organization receives dispatch only for
-- the urgency/incident type it explicitly opted into (ORG-004) - and
-- the real trigger path (opening a case) actually enqueues the
-- notification, not just the matching function in isolation.
do $$
declare
  v_admin uuid := pg_temp.mk_user('org_admin_b');
  v_moderator uuid := pg_temp.mk_user('org_moderator_b');
  v_org uuid;
  v_matching_case uuid;
  v_wrong_urgency_case uuid;
  v_wrong_incident_case uuid;
  v_unavailable_case uuid;
  v_notif_count int;
begin
  update profiles set role = 'moderator' where id = v_moderator;
  call pg_temp.as_user(v_admin, format('insert into organizations (name, org_type, created_by) values (''Verified Org B'', ''ngo'', %L)', v_admin));
  select id into v_org from organizations where name = 'Verified Org B';
  call pg_temp.as_user(v_moderator, format(
    'update organizations set verification_status = ''verified'', verified_by = %L, verified_at = now() where id = %L',
    v_moderator, v_org
  ));
  call pg_temp.as_user(v_admin, format(
    'insert into organization_members (organization_id, user_id, role) values (%L, %L, ''administrator'')',
    v_org, v_admin
  ));
  call pg_temp.as_user(v_admin, format(
    $q$insert into organization_availability (organization_id, is_currently_available, opted_in_urgency_levels, opted_in_incident_types)
       values (%L, true, array['critical']::urgency_level[], array['injured_animal']::incident_type[])$q$,
    v_org
  ));

  v_matching_case := pg_temp.mk_case(pg_temp.mk_user('org_case_creator_b1'), 'critical', 'injured_animal');
  assert exists (select 1 from find_org_alert_candidates(v_matching_case) where user_id = v_admin),
    'a verified, available, opted-in organization must be a dispatch candidate for a matching case';

  v_wrong_urgency_case := pg_temp.mk_case(pg_temp.mk_user('org_case_creator_b2'), 'support_needed', 'injured_animal');
  assert not exists (select 1 from find_org_alert_candidates(v_wrong_urgency_case) where user_id = v_admin),
    'an organization not opted into this urgency level must not be a dispatch candidate';

  v_wrong_incident_case := pg_temp.mk_case(pg_temp.mk_user('org_case_creator_b3'), 'critical', 'road_accident');
  assert not exists (select 1 from find_org_alert_candidates(v_wrong_incident_case) where user_id = v_admin),
    'an organization not opted into this incident type must not be a dispatch candidate';

  update organization_availability set is_currently_available = false where organization_id = v_org;
  v_unavailable_case := pg_temp.mk_case(pg_temp.mk_user('org_case_creator_b4'), 'critical', 'injured_animal');
  assert not exists (select 1 from find_org_alert_candidates(v_unavailable_case) where user_id = v_admin),
    'an organization marked unavailable must not be a dispatch candidate';
  update organization_availability set is_currently_available = true where organization_id = v_org;

  -- The real path: mk_case already drove the matching case through
  -- create_case(), which calls transition_case_status(..., 'open', ...)
  -- itself - the trigger that actually enqueues organization_alert
  -- notifications already fired for v_matching_case above.
  select count(*) into v_notif_count
  from notifications
  where recipient_id = v_admin and case_id = v_matching_case and category = 'organization_alert';
  assert v_notif_count = 1, 'opening a matching case must enqueue exactly one organization_alert notification';
end $$;

-- 3. Verification is moderator/administrator-only, never
-- self-service by an org's own administrator (prevent_self_verification,
-- already in place since Part 1, re-asserted here since this part's
-- own task list names it explicitly).
do $$
declare
  v_admin uuid := pg_temp.mk_user('org_admin_c');
  v_moderator uuid := pg_temp.mk_user('org_moderator_c');
  v_org uuid;
  v_failed boolean := false;
begin
  update profiles set role = 'moderator' where id = v_moderator;

  call pg_temp.as_user(v_admin, format('insert into organizations (name, org_type, created_by) values (''Org C'', ''clinic'', %L)', v_admin));
  select id into v_org from organizations where name = 'Org C';
  call pg_temp.as_user(v_admin, format(
    'insert into organization_members (organization_id, user_id, role) values (%L, %L, ''administrator'')',
    v_org, v_admin
  ));

  begin
    call pg_temp.as_user(v_admin, format(
      'update organizations set verification_status = ''verified'' where id = %L', v_org
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'an organization administrator must not be able to self-verify';

  call pg_temp.as_user(v_moderator, format(
    'update organizations set verification_status = ''verified'', verified_by = %L, verified_at = now() where id = %L',
    v_moderator, v_org
  ));
  assert (select verification_status from organizations where id = v_org) = 'verified',
    'a moderator must be able to verify an organization';
  assert (select verified_by from organizations where id = v_org) = v_moderator,
    'the verifying authority must be recorded';
  assert (select org_type from list_verified_directory() where id = v_org) = 'clinic',
    'the directory must expose the verification scope (org_type)';
end $$;

-- 4. Foster addresses: unreachable by a bystander, reachable by the
-- foster themselves, reachable by the case creator only after an
-- approved placement request, and never reachable while the request
-- is merely pending.
do $$
declare
  v_foster_user uuid := pg_temp.mk_user('foster_d');
  v_creator uuid := pg_temp.mk_user('foster_case_creator_d');
  v_bystander uuid := pg_temp.mk_user('foster_bystander_d');
  v_foster_profile uuid;
  v_case uuid;
  v_request uuid;
begin
  call pg_temp.as_user(v_foster_user, format(
    $q$insert into foster_profiles (user_id, capacity, area, address) values (%L, 2, 'Dhanmondi', '123 Secret Road') returning id$q$,
    v_foster_user
  ));
  select id into v_foster_profile from foster_profiles where user_id = v_foster_user;

  v_case := pg_temp.mk_case(v_creator, 'support_needed', 'temporary_foster_needed');

  call pg_temp.as_user(v_bystander, 'select 1');
  perform set_config('request.jwt.claim.sub', v_bystander::text, true);
  set local role authenticated;
  assert get_foster_address(v_foster_profile) is null,
    'a bystander must never read a foster address';
  reset role;

  perform set_config('request.jwt.claim.sub', v_foster_user::text, true);
  set local role authenticated;
  assert get_foster_address(v_foster_profile) = '123 Secret Road',
    'a foster must be able to read their own address';
  reset role;

  perform set_config('request.jwt.claim.sub', v_creator::text, true);
  set local role authenticated;
  assert get_foster_address(v_foster_profile) is null,
    'the case creator must not read the address before any placement request exists';
  reset role;

  call pg_temp.as_user(v_creator, format(
    'insert into foster_placement_requests (case_id, foster_profile_id, requested_by) values (%L, %L, %L) returning id',
    v_case, v_foster_profile, v_creator
  ));
  select id into v_request from foster_placement_requests where case_id = v_case and foster_profile_id = v_foster_profile;

  perform set_config('request.jwt.claim.sub', v_creator::text, true);
  set local role authenticated;
  assert get_foster_address(v_foster_profile) is null,
    'the case creator must not read the address while the placement request is only pending';
  reset role;

  call pg_temp.as_user(v_foster_user, format(
    'update foster_placement_requests set status = ''approved'', decided_by = %L, decided_at = now() where id = %L',
    v_foster_user, v_request
  ));

  perform set_config('request.jwt.claim.sub', v_creator::text, true);
  set local role authenticated;
  assert get_foster_address(v_foster_profile) = '123 Secret Road',
    'the case creator must be able to read the address once the placement request is approved';
  reset role;
end $$;

-- 5. A placement request cannot be re-decided, and only the
-- requester may withdraw their own.
do $$
declare
  v_foster_user uuid := pg_temp.mk_user('foster_e');
  v_creator uuid := pg_temp.mk_user('foster_case_creator_e');
  v_foster_profile uuid;
  v_case uuid;
  v_request uuid;
  v_failed boolean := false;
begin
  call pg_temp.as_user(v_foster_user, format(
    $q$insert into foster_profiles (user_id, capacity, area, address) values (%L, 2, 'Mirpur', '456 Other Road')$q$,
    v_foster_user
  ));
  select id into v_foster_profile from foster_profiles where user_id = v_foster_user;
  v_case := pg_temp.mk_case(v_creator, 'support_needed', 'temporary_foster_needed');

  call pg_temp.as_user(v_creator, format(
    'insert into foster_placement_requests (case_id, foster_profile_id, requested_by) values (%L, %L, %L)',
    v_case, v_foster_profile, v_creator
  ));
  select id into v_request from foster_placement_requests where case_id = v_case and foster_profile_id = v_foster_profile;

  call pg_temp.as_user(v_foster_user, format(
    'update foster_placement_requests set status = ''declined'', decided_by = %L, decided_at = now() where id = %L',
    v_foster_user, v_request
  ));

  begin
    call pg_temp.as_user(v_creator, format(
      'update foster_placement_requests set status = ''withdrawn'' where id = %L', v_request
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'a decided placement request must not be changeable again';
end $$;
