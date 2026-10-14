-- Real bug found testing Part 14: organization_members_insert's own
-- WITH CHECK did a raw `exists (select 1 from organization_members
-- where ...)` against the very table being inserted into. Postgres's
-- planner refuses this outright ("infinite recursion detected in
-- policy for relation organization_members") rather than silently
-- misbehaving - proven directly by actually trying to add the first
-- member to a brand-new organization, something nothing in this
-- project had ever exercised before. Fixed with the same
-- security-definer-helper pattern already used by is_org_member/
-- is_case_creator for exactly this reason (see create_rls_helper_
-- functions.sql's own comment on why they exist).
create or replace function organization_member_count(p_org_id uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select count(*) from organization_members where organization_id = p_org_id;
$$;

drop policy organization_members_insert on organization_members;
create policy organization_members_insert on organization_members
  for insert to authenticated with check (
    (user_id = auth.uid() and organization_member_count(organization_id) = 0)
    or is_org_admin(organization_id)
    or is_moderator_or_admin()
  );
