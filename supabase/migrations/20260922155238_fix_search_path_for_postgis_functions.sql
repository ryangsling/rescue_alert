
create or replace function derive_approximate_location() returns trigger
language plpgsql set search_path = public, extensions as $$
begin
  if new.location is null then
    new.approximate_location := null;
  else
    new.approximate_location := st_setsrid(
      st_makepoint(
        round(st_x(new.location::geometry)::numeric, 3),
        round(st_y(new.location::geometry)::numeric, 3)
      ),
      4326
    )::geography;
  end if;
  return new;
end;
$$;

create or replace function get_case_exact_location(p_case_id uuid) returns geography
language sql stable security definer set search_path = public, extensions as $$
  select location from rescue_cases
  where id = p_case_id and is_case_participant(p_case_id);
$$;

create or replace function get_case_location_history(p_case_id uuid)
returns table (id uuid, location geography, landmark text, changed_by uuid, change_reason text, created_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  select l.id, l.location, l.landmark, l.changed_by, l.change_reason, l.created_at
  from rescue_case_locations l
  where l.case_id = p_case_id and is_case_participant(p_case_id)
  order by l.created_at desc;
$$;

create or replace function rescue_cases_public()
returns table (
  id uuid,
  public_reference text,
  incident_type incident_type,
  animal_type text,
  urgency urgency_level,
  status case_status,
  title text,
  division text,
  district text,
  upazila_or_thana text,
  approximate_location geography,
  reported_at timestamptz,
  updated_at timestamptz,
  last_official_update text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    c.id,
    c.public_reference,
    c.incident_type,
    a.slug,
    c.urgency,
    c.status,
    c.title,
    c.division,
    c.district,
    c.upazila_or_thana,
    c.approximate_location,
    c.reported_at,
    c.updated_at,
    (
      select body from case_updates u
      where u.case_id = c.id
      order by u.created_at desc
      limit 1
    )
  from rescue_cases c
  left join animal_types a on a.id = c.animal_type_id
  where c.status not in (
    'draft', 'submitted', 'under_review', 'duplicate', 'false_report',
    'spam', 'unsafe_or_prohibited_content', 'cancelled_by_reporter'
  )
  and c.exact_location_visibility = 'standard';
$$;
