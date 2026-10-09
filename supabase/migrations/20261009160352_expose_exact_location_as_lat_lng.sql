-- Same fix as list_feed_cases_expose_lat_lng.sql: PostgREST
-- serializes a raw geography value as a WKB hex string, which no
-- client code in this project has a parser for. ST_Y/ST_X are cheap
-- scalar extraction on an already-fetched point, not an extra lookup.
drop function if exists get_case_exact_location(uuid);

create or replace function get_case_exact_location(p_case_id uuid)
returns table (latitude double precision, longitude double precision)
language sql stable security definer set search_path = public, extensions as $$
  select st_y(location::geometry), st_x(location::geometry)
  from rescue_cases
  where id = p_case_id and is_case_participant(p_case_id);
$$;

comment on function get_case_exact_location is 'The only way to read a case exact coordinate. Returns no row if the case does not exist or the caller is not an accepted responder, the coordinator, an org member, or a moderator/administrator. latitude/longitude as plain doubles (ST_Y/ST_X), never a raw geography value.';

revoke all on function get_case_exact_location(uuid) from public, anon;
grant execute on function get_case_exact_location(uuid) to authenticated;
