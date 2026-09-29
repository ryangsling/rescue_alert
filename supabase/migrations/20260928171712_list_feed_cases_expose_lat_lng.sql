drop function if exists list_feed_cases(double precision, double precision, integer, uuid[], incident_type[], text, timestamptz, boolean, integer, integer);

-- Part 10 follow-up: expose approximate_lat/lng directly instead of
-- the raw PostGIS geography value, which PostgREST serializes as a
-- WKB hex string the client would need a PostGIS-aware parser to
-- read. ST_Y/ST_X on the already-computed approximate_location is a
-- cheap scalar extraction, not an extra geometry operation.
create or replace function list_feed_cases(
  p_viewer_lat double precision default null,
  p_viewer_lng double precision default null,
  p_radius_meters integer default null,
  p_animal_type_ids uuid[] default null,
  p_incident_types incident_type[] default null,
  p_search_text text default null,
  p_since timestamptz default null,
  p_include_closed boolean default false,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  public_reference text,
  incident_type incident_type,
  animal_type_slug text,
  urgency urgency_level,
  status case_status,
  title text,
  division text,
  district text,
  upazila_or_thana text,
  approximate_latitude double precision,
  approximate_longitude double precision,
  reported_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision,
  priority_tier integer,
  thumbnail_storage_path text,
  thumbnail_is_graphic boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  with viewer_point as (
    select case
      when p_viewer_lat is not null and p_viewer_lng is not null
        then st_setsrid(st_makepoint(p_viewer_lng, p_viewer_lat), 4326)::geography
      else null
    end as pt
  ),
  viewer_capabilities as (
    select coalesce(array_agg(capability), '{}'::volunteer_capability_type[]) as caps
    from volunteer_capabilities
    where user_id = auth.uid()
  ),
  active_statuses as (
    select array[
      'open', 'response_committed', 'responder_en_route', 'animal_located',
      'rescue_in_progress', 'transporting', 'at_clinic_foster_shelter',
      'follow_up_required'
    ]::case_status[] as statuses
  ),
  closed_statuses as (
    select array[
      'resolved', 'closed', 'no_longer_found', 'cancelled_by_reporter',
      'closed_by_moderator'
    ]::case_status[] as statuses
  ),
  scored as (
    select
      c.id,
      c.public_reference,
      c.incident_type,
      a.slug as animal_type_slug,
      c.urgency,
      c.status,
      c.title,
      c.division,
      c.district,
      c.upazila_or_thana,
      st_y(c.approximate_location::geometry) as approximate_latitude,
      st_x(c.approximate_location::geometry) as approximate_longitude,
      c.reported_at,
      c.updated_at,
      case
        when (select pt from viewer_point) is not null
          then st_distance(c.approximate_location, (select pt from viewer_point))
        else null
      end as distance_meters,
      (
        select m.storage_path from rescue_media m
        where m.case_id = c.id
        order by m.created_at asc
        limit 1
      ) as thumbnail_storage_path,
      (
        select m.is_graphic from rescue_media m
        where m.case_id = c.id
        order by m.created_at asc
        limit 1
      ) as thumbnail_is_graphic,
      exists (
        select 1 from unnest((select caps from viewer_capabilities)) cap
        where incident_type_matches_capability(c.incident_type, cap)
      ) as capability_match,
      (
        exists (
          select 1 from case_responses r
          where r.case_id = c.id and r.status in ('committed', 'confirmed')
        )
        and exists (
          select 1 from case_needs n
          where n.case_id = c.id and n.is_fulfilled = false
        )
      ) as has_committed_response_with_open_need
    from rescue_cases c
    left join animal_types a on a.id = c.animal_type_id
    where c.status not in (
      'draft', 'submitted', 'under_review', 'duplicate', 'false_report',
      'spam', 'unsafe_or_prohibited_content'
    )
    and c.exact_location_visibility = 'standard'
    and c.status = any(
      case when p_include_closed
        then (select statuses from closed_statuses)
        else (select statuses from active_statuses)
      end
    )
    and (p_animal_type_ids is null or c.animal_type_id = any(p_animal_type_ids))
    and (p_incident_types is null or c.incident_type = any(p_incident_types))
    and (p_since is null or c.reported_at >= p_since)
    and (
      p_search_text is null or p_search_text = ''
      or c.title ilike '%' || p_search_text || '%'
      or c.description ilike '%' || p_search_text || '%'
    )
    and (
      p_radius_meters is null or (select pt from viewer_point) is null
      or st_dwithin(c.approximate_location, (select pt from viewer_point), p_radius_meters)
    )
  ),
  tiered as (
    select
      *,
      case
        when urgency = 'critical' and capability_match then 1
        when urgency = 'urgent' and capability_match then 2
        when has_committed_response_with_open_need then 3
        when incident_type in ('temporary_foster_needed', 'shelter_needed', 'adoption_needed')
          or urgency = 'adoption_community' then 5
        else 4
      end as priority_tier
    from scored
  )
  select
    t.id, t.public_reference, t.incident_type, t.animal_type_slug, t.urgency,
    t.status, t.title, t.division, t.district, t.upazila_or_thana,
    t.approximate_latitude, t.approximate_longitude,
    t.reported_at, t.updated_at, t.distance_meters,
    t.priority_tier, t.thumbnail_storage_path, t.thumbnail_is_graphic,
    count(*) over ()::bigint as total_count
  from tiered t
  order by t.priority_tier asc, t.distance_meters asc nulls last, t.reported_at desc
  limit least(coalesce(p_limit, 20), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

comment on function list_feed_cases is
  'Part 10 nearby feed: DESIGN.md 14.2 five-tier priority ranking, filters, বাংলা/English substring search, and pagination (capped at 50/page). Returns approximate_latitude/longitude as plain doubles (ST_Y/ST_X) rather than a raw geography value, so clients need no PostGIS-aware parsing. Tier 3 uses real case_responses/case_needs data. Never returns exact coordinates or restricted-visibility cases. Active and closed statuses are mutually exclusive per call (p_include_closed).';

grant execute on function list_feed_cases(double precision, double precision, integer, uuid[], incident_type[], text, timestamptz, boolean, integer, integer) to authenticated, anon;
