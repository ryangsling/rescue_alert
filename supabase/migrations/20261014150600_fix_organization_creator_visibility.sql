-- Real bug found testing Part 14: organizations had no creator
-- tracking at all, and organizations_select only allows a verified
-- org, an existing member, or a moderator to read a row. Proven
-- directly: `insert into organizations (...) returning id` as a
-- brand-new authenticated user raises "new row violates row-level
-- security policy" - RETURNING re-checks the SELECT policy against
-- the just-inserted row, and a freshly created org is pending with no
-- organization_members row yet, so nobody could ever read back their
-- own newly created organization. This would have silently broken
-- the .insert().select().single() pattern used everywhere else in
-- this codebase the moment an organizations API function was built.
alter table organizations add column created_by uuid references profiles(id);

create index organizations_created_by_idx on organizations (created_by);

drop policy organizations_select on organizations;
create policy organizations_select on organizations
  for select using (
    verification_status = 'verified'
    or is_org_member(id)
    or created_by = auth.uid()
    or is_moderator_or_admin()
  );

-- created_by is now stamped from auth.uid(), never trusted from the
-- client - the same rule already applied to every other actor field
-- in this project.
drop policy organizations_insert_authenticated on organizations;
create policy organizations_insert_authenticated on organizations
  for insert to authenticated with check (created_by = auth.uid());
