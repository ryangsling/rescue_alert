-- Real gap found while testing AUTH-009 (Part 7): as written, this
-- trigger required is_moderator_or_admin() to already be true for
-- ANY role/is_suspended change, including one made by a direct
-- database operator session (auth.uid() is null there, since there
-- is no PostgREST JWT context) - meaning there was no path at all to
-- create the very first moderator/administrator on a real project.
--
-- Fix: also allow the change when auth.uid() is null. That is only
-- ever true for a direct DB connection (project operator via the
-- Supabase SQL editor, MCP, or psql) - an authenticated app user's
-- auth.uid() is never null, so this does not weaken what the trigger
-- actually defends against (self-escalation through the API).
create or replace function prevent_self_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.is_suspended is distinct from old.is_suspended)
     and not (is_moderator_or_admin() or auth.uid() is null) then
    raise exception 'only a moderator or administrator may change role or is_suspended';
  end if;
  return new;
end;
$$;
