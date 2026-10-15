-- Part 19: RLS coverage for four tables no existing test file ever
-- touched (clinics, shelters, organization_services,
-- foster_supported_animal_types) - exactly the "dormant schema"
-- pattern that produced real bugs in Parts 14/15/16 when finally
-- exercised. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('admin_member');
select pg_temp.mk_user('plain_member');
select pg_temp.mk_user('outsider');
\o

do $$
declare
  v_org_id uuid;
  v_admin uuid := pg_temp.uid('admin_member');
  v_plain uuid := pg_temp.uid('plain_member');
  v_outsider uuid := pg_temp.uid('outsider');
begin
  insert into organizations (name, org_type, created_by)
    values ('Test Clinic Org', 'clinic', v_admin)
    returning id into v_org_id;
  insert into organization_members (organization_id, user_id, role) values
    (v_org_id, v_admin, 'administrator'),
    (v_org_id, v_plain, 'member');

  -- clinics_write: only an org administrator (or moderator) may write
  -- facility details - a plain member may not.
  call pg_temp.as_user(v_admin, format(
    'insert into clinics (organization_id, specializations, emergency_capable) values (%L, %L, true)',
    v_org_id, 'surgery'
  ));
  assert (select emergency_capable from clinics where organization_id = v_org_id) = true,
    'an org administrator can write clinic details';

  begin
    call pg_temp.as_user(v_plain, format(
      'update clinics set emergency_capable = false where organization_id = %L', v_org_id
    ));
    assert (select emergency_capable from clinics where organization_id = v_org_id) = true,
      'a plain org member must not be able to change clinic details (RLS silently filtered the update)';
  end;

  begin
    call pg_temp.as_user(v_outsider, format(
      'update clinics set emergency_capable = false where organization_id = %L', v_org_id
    ));
    assert (select emergency_capable from clinics where organization_id = v_org_id) = true,
      'an outsider must not be able to change clinic details';
  end;

  -- shelters_write: same shape as clinics.
  call pg_temp.as_user(v_admin, format(
    'insert into shelters (organization_id, capacity_total, capacity_available) values (%L, 10, 4)',
    v_org_id
  ));
  begin
    call pg_temp.as_user(v_plain, format(
      'update shelters set capacity_available = 0 where organization_id = %L', v_org_id
    ));
    assert (select capacity_available from shelters where organization_id = v_org_id) = 4,
      'a plain org member must not be able to change shelter capacity';
  end;

  -- organization_services_write: deliberately looser than clinics/
  -- shelters - any org MEMBER (not just an administrator) may write,
  -- per its own policy using is_org_member rather than is_org_admin.
  call pg_temp.as_user(v_plain, format(
    'insert into organization_services (organization_id, service_name) values (%L, %L)',
    v_org_id, 'Free deworming'
  ));
  assert exists (select 1 from organization_services where organization_id = v_org_id and service_name = 'Free deworming'),
    'any org member (not only an administrator) may add a service - confirms the intentional asymmetry with clinics/shelters';

  begin
    call pg_temp.as_user(v_outsider, format(
      'insert into organization_services (organization_id, service_name) values (%L, %L)',
      v_org_id, 'Should not exist'
    ));
    assert false, 'an outsider must not be able to add a service';
  exception when others then
    reset role;
    assert not exists (select 1 from organization_services where service_name = 'Should not exist'),
      'no service was actually inserted by the rejected outsider attempt';
  end;
end $$;

-- foster_supported_animal_types: only the foster profile's OWNER may
-- write it - organization roles are irrelevant here, it is an
-- individual volunteer's own profile.
do $$
declare
  v_owner uuid := pg_temp.uid('admin_member');
  v_other uuid := pg_temp.uid('outsider');
  v_foster_id uuid;
  v_dog_type uuid;
begin
  insert into animal_types (slug, label_en, label_bn) values ('dog_rls_test', 'Dog', 'kukur')
    on conflict (slug) do update set slug = excluded.slug
    returning id into v_dog_type;

  call pg_temp.as_user(v_owner,
    'insert into foster_profiles (user_id, capacity) values (''' || v_owner || ''', 2)');
  select id into v_foster_id from foster_profiles where user_id = v_owner;

  call pg_temp.as_user(v_owner, format(
    'insert into foster_supported_animal_types (foster_profile_id, animal_type_id) values (%L, %L)',
    v_foster_id, v_dog_type
  ));
  assert exists (
    select 1 from foster_supported_animal_types where foster_profile_id = v_foster_id and animal_type_id = v_dog_type
  ), 'a foster profile owner can declare a supported animal type';

  begin
    call pg_temp.as_user(v_other, format(
      'delete from foster_supported_animal_types where foster_profile_id = %L', v_foster_id
    ));
    assert exists (
      select 1 from foster_supported_animal_types where foster_profile_id = v_foster_id and animal_type_id = v_dog_type
    ), 'another user must not be able to delete someone else''s foster supported-animal-type row';
  end;
end $$;
