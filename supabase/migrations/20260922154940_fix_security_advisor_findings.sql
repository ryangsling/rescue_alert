
-- Fix 1: bare view over an RLS table runs with the owner's
-- permissions and bypasses RLS with no explicit, auditable signal
-- that this is intentional (Supabase security_definer_view lint,
-- ERROR). Replaced with an explicit security definer function - the
-- sanctioned mechanism for a curated anon-safe read.
drop view if exists rescue_cases_public;

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
set search_path = public
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

comment on function rescue_cases_public is 'CASE-005/MAP-005/FEED-005: anon-safe case list for public share pages. Excludes exact location, creator identity, and restricted-sensitivity cases entirely. Callable by anon by design.';

revoke all on function rescue_cases_public() from public;
grant execute on function rescue_cases_public() to anon, authenticated;

-- Fix 2: RLS was left disabled on this lookup table. Non-sensitive
-- reference data (the legal status graph), so a single read-only
-- policy is enough; writes happen only through migrations.
alter table case_status_transitions enable row level security;
create policy case_status_transitions_select on case_status_transitions
  for select using (true);

-- Fix 3: pin search_path on the four functions created before this
-- became the default pattern, closing the search-path-hijack gap.
create or replace function generate_public_reference() returns text
language sql volatile set search_path = public as $$
  select 'RA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

create or replace function guard_status_column() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('rescue_alert.allow_status_change', true), '') <> 'true' then
    raise exception 'status may only be changed via transition_case_status()';
  end if;
  return new;
end;
$$;

create or replace function derive_approximate_location() returns trigger
language plpgsql set search_path = public as $$
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

create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
