
create or replace function prevent_self_verification() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.verification_status is distinct from old.verification_status
      or new.verified_by is distinct from old.verified_by
      or new.verified_at is distinct from old.verified_at)
     and not is_moderator_or_admin() then
    raise exception 'only a moderator or administrator may change verification_status';
  end if;
  return new;
end;
$$;

create trigger organizations_prevent_self_verification
  before update on organizations
  for each row execute function prevent_self_verification();

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_services enable row level security;
alter table organization_availability enable row level security;
alter table clinics enable row level security;
alter table shelters enable row level security;
alter table foster_profiles enable row level security;
alter table foster_supported_animal_types enable row level security;

-- organizations: PRD 15.2 lists the organization directory as a
-- public web page, and none of these fields are sensitive, so
-- verified organizations are readable by anon. Pending/rejected
-- orgs are visible only to their own members and moderators/admins.
create policy organizations_select on organizations
  for select using (
    verification_status = 'verified'
    or is_org_member(id)
    or is_moderator_or_admin()
  );
create policy organizations_insert_authenticated on organizations
  for insert to authenticated with check (true);
create policy organizations_update on organizations
  for update to authenticated
  using (is_org_admin(id) or is_moderator_or_admin())
  with check (is_org_admin(id) or is_moderator_or_admin());

create policy organization_members_select on organization_members
  for select using (
    exists (select 1 from organizations o where o.id = organization_id and o.verification_status = 'verified')
    or is_org_member(organization_id)
    or is_moderator_or_admin()
  );
-- ORG-005: the first member (creator) may add themselves; further
-- membership changes require an existing org administrator.
create policy organization_members_insert on organization_members
  for insert to authenticated with check (
    (user_id = auth.uid() and not exists (select 1 from organization_members m where m.organization_id = organization_id))
    or is_org_admin(organization_id)
    or is_moderator_or_admin()
  );
create policy organization_members_update on organization_members
  for update to authenticated
  using (is_org_admin(organization_id) or is_moderator_or_admin())
  with check (is_org_admin(organization_id) or is_moderator_or_admin());
create policy organization_members_delete on organization_members
  for delete to authenticated
  using (user_id = auth.uid() or is_org_admin(organization_id) or is_moderator_or_admin());

create policy organization_services_select on organization_services
  for select using (
    exists (select 1 from organizations o where o.id = organization_id and o.verification_status = 'verified')
    or is_org_member(organization_id)
    or is_moderator_or_admin()
  );
create policy organization_services_write on organization_services
  for all to authenticated
  using (is_org_member(organization_id) or is_moderator_or_admin())
  with check (is_org_member(organization_id) or is_moderator_or_admin());

create policy organization_availability_select on organization_availability
  for select using (
    exists (select 1 from organizations o where o.id = organization_id and o.verification_status = 'verified')
    or is_org_member(organization_id)
    or is_moderator_or_admin()
  );
create policy organization_availability_write on organization_availability
  for all to authenticated
  using (is_org_admin(organization_id) or is_moderator_or_admin())
  with check (is_org_admin(organization_id) or is_moderator_or_admin());

create policy clinics_select on clinics
  for select using (
    exists (select 1 from organizations o where o.id = organization_id and o.verification_status = 'verified')
    or is_org_member(organization_id)
    or is_moderator_or_admin()
  );
create policy clinics_write on clinics
  for all to authenticated
  using (is_org_admin(organization_id) or is_moderator_or_admin())
  with check (is_org_admin(organization_id) or is_moderator_or_admin());

create policy shelters_select on shelters
  for select using (
    exists (select 1 from organizations o where o.id = organization_id and o.verification_status = 'verified')
    or is_org_member(organization_id)
    or is_moderator_or_admin()
  );
create policy shelters_write on shelters
  for all to authenticated
  using (is_org_admin(organization_id) or is_moderator_or_admin())
  with check (is_org_admin(organization_id) or is_moderator_or_admin());

-- foster_profiles: ORG-006 - individual foster capacity is treated
-- more sensitively than an organization's own facility capacity, but
-- active listings still need to be discoverable by any signed-in
-- volunteer to make a placement request (PRD 5.4). area is a coarse
-- administrative area, never an exact address.
create policy foster_profiles_select on foster_profiles
  for select to authenticated
  using (is_active or user_id = auth.uid() or is_moderator_or_admin());
create policy foster_profiles_write on foster_profiles
  for all to authenticated
  using (user_id = auth.uid() or is_moderator_or_admin())
  with check (user_id = auth.uid() or is_moderator_or_admin());

create policy foster_supported_animal_types_select on foster_supported_animal_types
  for select to authenticated
  using (
    exists (select 1 from foster_profiles f where f.id = foster_profile_id and (f.is_active or f.user_id = auth.uid()))
    or is_moderator_or_admin()
  );
create policy foster_supported_animal_types_write on foster_supported_animal_types
  for all to authenticated
  using (
    exists (select 1 from foster_profiles f where f.id = foster_profile_id and f.user_id = auth.uid())
    or is_moderator_or_admin()
  )
  with check (
    exists (select 1 from foster_profiles f where f.id = foster_profile_id and f.user_id = auth.uid())
    or is_moderator_or_admin()
  );
