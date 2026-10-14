-- Part 16: public open-case and rescue-history listings. The open
-- listing reuses rescue_cases_public()'s own visibility rule rather
-- than redefining it, by selecting from that function directly
-- (Part 3 replaced the original view with a SECURITY DEFINER function
-- of the same name, to satisfy the security_definer_view advisor).
create or replace function list_public_open_cases(p_limit integer default 20, p_offset integer default 0)
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
  select *
  from rescue_cases_public()
  where status in (
    'open', 'response_committed', 'responder_en_route', 'animal_located',
    'rescue_in_progress', 'transporting', 'at_clinic_foster_shelter', 'follow_up_required'
  )
  order by
    case urgency when 'critical' then 0 when 'urgent' then 1 when 'support_needed' then 2 else 3 end,
    reported_at desc
  limit p_limit offset p_offset;
$$;

-- "Rescue history" means a recorded outcome (close_case()), not merely
-- a terminal status - that is what makes it informative rather than
-- just "closed".
create or replace function list_public_rescue_history(p_limit integer default 20, p_offset integer default 0)
returns table (
  public_reference text,
  incident_type incident_type,
  animal_type text,
  division text,
  district text,
  upazila_or_thana text,
  outcome closure_outcome,
  final_update text,
  closed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.public_reference, c.incident_type, a.slug, c.division, c.district, c.upazila_or_thana,
    o.outcome, o.final_update, c.closed_at
  from rescue_outcomes o
  join rescue_cases c on c.id = o.case_id
  left join animal_types a on a.id = c.animal_type_id
  where c.exact_location_visibility = 'standard'
  order by c.closed_at desc nulls last
  limit p_limit offset p_offset;
$$;

revoke all on function list_public_open_cases(integer, integer) from public;
revoke all on function list_public_rescue_history(integer, integer) from public;
grant execute on function list_public_open_cases(integer, integer) to anon, authenticated;
grant execute on function list_public_rescue_history(integer, integer) to anon, authenticated;
