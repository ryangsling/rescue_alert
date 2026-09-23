-- CASE-009. PRD leaves the exact radius/timeframe as an open
-- implementation decision ("nearby/time-based duplicate detection");
-- 150m / 180 minutes are disclosed, adjustable defaults, not a PRD
-- value. Uses approximate_location (never the exact coordinate) and
-- only surfaces cases in an active, non-terminal, non-rejected
-- status - a case still in draft/submitted/under_review isn't
-- publicly visible yet, and a closed/rejected one isn't a live
-- duplicate to warn about. security invoker: authenticated already
-- has column-level SELECT on approximate_location (Part 3), no
-- privilege escalation needed.
create or replace function find_nearby_duplicate_cases(
  p_location geography,
  p_radius_meters numeric default 150,
  p_since_minutes integer default 180
) returns table (
  id uuid,
  public_reference text,
  title text,
  urgency urgency_level,
  status case_status,
  distance_meters numeric,
  reported_at timestamptz
)
language sql stable set search_path = public, extensions as $$
  select
    c.id, c.public_reference, c.title, c.urgency, c.status,
    st_distance(c.approximate_location, p_location) as distance_meters,
    c.reported_at
  from rescue_cases c
  where c.status in (
    'open', 'response_committed', 'responder_en_route', 'animal_located',
    'rescue_in_progress', 'transporting', 'at_clinic_foster_shelter', 'follow_up_required'
  )
  and c.reported_at >= now() - make_interval(mins => p_since_minutes)
  and st_dwithin(c.approximate_location, p_location, p_radius_meters)
  order by distance_meters asc;
$$;

revoke execute on function find_nearby_duplicate_cases(geography, numeric, integer) from anon;
grant execute on function find_nearby_duplicate_cases(geography, numeric, integer) to authenticated;
