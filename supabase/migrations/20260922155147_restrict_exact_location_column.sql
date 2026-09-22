
-- rescue_cases.location is on the same row as broadly-visible fields
-- (title, status, approximate_location, ...), but RLS policies are
-- row-scoped, not column-scoped, so the earlier rescue_cases_select
-- policy alone would let any authenticated user read the exact
-- coordinate of a public case via a plain `select *` - contradicting
-- the confirmed decision that only accepted responders, the
-- coordinator, and moderators may see it.
--
-- Fix: revoke column-level SELECT on `location` from authenticated
-- entirely (anon already has no table grant on rescue_cases), so no
-- ordinary query can read it regardless of row visibility. Access
-- goes exclusively through get_case_exact_location(), which enforces
-- is_case_participant() before returning a value.
--
-- Consequence for client code: never `select('*')` on rescue_cases -
-- it will fail with a column permission error. List columns
-- explicitly, and call get_case_exact_location() when the exact
-- point is genuinely needed.
revoke select (location) on rescue_cases from authenticated;

create or replace function get_case_exact_location(p_case_id uuid) returns geography
language sql stable security definer set search_path = public as $$
  select location from rescue_cases
  where id = p_case_id and is_case_participant(p_case_id);
$$;

comment on function get_case_exact_location is 'The only way to read a case exact coordinate. Returns null if the case does not exist or the caller is not an accepted responder, the coordinator, an org member, or a moderator/administrator.';

revoke all on function get_case_exact_location(uuid) from public;
grant execute on function get_case_exact_location(uuid) to authenticated;

-- Same column-level gap and fix applies to the location history table.
revoke select (location) on rescue_case_locations from authenticated;

create or replace function get_case_location_history(p_case_id uuid)
returns table (id uuid, location geography, landmark text, changed_by uuid, change_reason text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.location, l.landmark, l.changed_by, l.change_reason, l.created_at
  from rescue_case_locations l
  where l.case_id = p_case_id and is_case_participant(p_case_id)
  order by l.created_at desc;
$$;

revoke all on function get_case_location_history(uuid) from public;
grant execute on function get_case_location_history(uuid) to authenticated;
