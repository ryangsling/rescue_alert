
-- RLS helper functions. security definer so they can read profiles /
-- case_responses / organization_members directly without triggering
-- the RLS policies being evaluated on those same tables (which would
-- otherwise recurse). Each is STABLE and takes no untrusted input
-- beyond auth.uid() and ids already visible to the caller.

create or replace function current_profile_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_profile_is_suspended() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_suspended from profiles where id = auth.uid()), true);
$$;

comment on function current_profile_is_suspended is 'Defaults to true (suspended) when there is no profile row yet, so an unprovisioned account cannot write.';

create or replace function is_moderator_or_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_profile_role() in ('moderator', 'administrator'), false);
$$;

create or replace function is_case_creator(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rescue_cases where id = p_case_id and creator_id = auth.uid()
  );
$$;

create or replace function is_case_coordinator(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rescue_cases where id = p_case_id and coordinator_id = auth.uid()
  );
$$;

create or replace function is_accepted_responder(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from case_responses
    where case_id = p_case_id
      and responder_id = auth.uid()
      and status in ('committed', 'confirmed', 'completed')
  );
$$;

comment on function is_accepted_responder is 'Confirmed decision: exact case coordinates unlock only for accepted responders, the coordinator, and moderators.';

create or replace function is_case_participant(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_case_creator(p_case_id)
    or is_case_coordinator(p_case_id)
    or is_accepted_responder(p_case_id)
    or is_moderator_or_admin()
    or exists (
      select 1
      from rescue_cases c
      join organization_members m on m.organization_id = c.organization_id
      where c.id = p_case_id and m.user_id = auth.uid()
    );
$$;

create or replace function is_org_member(p_org_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = p_org_id and user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(p_org_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = p_org_id and user_id = auth.uid() and role = 'administrator'
  );
$$;
