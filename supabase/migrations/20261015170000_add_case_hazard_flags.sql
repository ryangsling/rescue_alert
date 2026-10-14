-- Part 17, PRD 12.1: "Let users indicate traffic, violence,
-- electrical, water, height, or other hazards." A plain array column,
-- not a join table - hazards are a small fixed set and never queried
-- independently of their case, unlike case_needs (which responders
-- filter and fulfill one at a time).
create type hazard_type as enum ('traffic', 'violence', 'electrical', 'water', 'height', 'other');

alter table rescue_cases add column hazard_flags hazard_type[] not null default '{}';

-- A new trailing parameter changes create_case()'s signature (even
-- with a default), so create or replace would create a second,
-- ambiguously-overloaded function rather than replacing this one -
-- the old 12-argument version must be dropped first.
drop function if exists create_case(
  text, incident_type, urgency_level, uuid, text, geography, text, text, text, text, boolean, timestamptz
);

create or replace function create_case(
  p_idempotency_key text,
  p_incident_type incident_type,
  p_urgency urgency_level,
  p_animal_type_id uuid,
  p_description text,
  p_location geography,
  p_landmark text,
  p_division text,
  p_district text,
  p_upazila_or_thana text,
  p_creator_on_site boolean,
  p_last_seen_at timestamptz default null,
  p_hazard_flags hazard_type[] default '{}'
) returns rescue_cases
language plpgsql security definer set search_path = public as $$
declare
  v_case rescue_cases;
begin
  if current_profile_is_suspended() then
    raise exception 'account_suspended';
  end if;

  select * into v_case from rescue_cases where idempotency_key = p_idempotency_key;
  if found then
    return v_case;
  end if;

  insert into rescue_cases (
    creator_id, idempotency_key, incident_type, urgency, animal_type_id,
    description, location, landmark, division, district, upazila_or_thana,
    creator_on_site, last_seen_at, hazard_flags
  ) values (
    auth.uid(), p_idempotency_key, p_incident_type, p_urgency, p_animal_type_id,
    p_description, p_location, p_landmark, p_division, p_district, p_upazila_or_thana,
    p_creator_on_site, p_last_seen_at, coalesce(p_hazard_flags, '{}')
  )
  returning * into v_case;

  perform transition_case_status(v_case.id, 'submitted', auth.uid(), 'Case reported');
  v_case := transition_case_status(v_case.id, 'open', auth.uid(), 'Case published; matching begun');

  return v_case;
end;
$$;

revoke execute on function create_case(
  text, incident_type, urgency_level, uuid, text, geography, text, text, text, text, boolean, timestamptz, hazard_type[]
) from anon;
grant execute on function create_case(
  text, incident_type, urgency_level, uuid, text, geography, text, text, text, text, boolean, timestamptz, hazard_type[]
) to authenticated;
