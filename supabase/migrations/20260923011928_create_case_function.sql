-- CASE-002, CASE-008, CASE-009, OFF-004. Single atomic entry point
-- for case creation. security definer because it writes
-- case_status_history directly through transition_case_status() -
-- that table has no insert policy at all (comment: "written only by
-- transition_case_status() - never directly"), so a security invoker
-- version could never write it. Suspension is still checked
-- explicitly (defense in depth - transition_case_status() checks the
-- actor's suspension too) and creator_id is always auth.uid(), never
-- a parameter, matching the RLS policy's own intent even though RLS
-- itself is bypassed here.
--
-- Real state machine read directly from case_status_transitions
-- (not assumed): draft -> submitted -> open is the normal,
-- non-moderated path ("submitted" -> "open" has requires_moderator =
-- false); "under_review" is a separate, moderator-triggered branch
-- this function does not use. Both transitions are logged through
-- transition_case_status() so case_status_history is populated the
-- one sanctioned way.
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
  p_last_seen_at timestamptz default null
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
    creator_on_site, last_seen_at
  ) values (
    auth.uid(), p_idempotency_key, p_incident_type, p_urgency, p_animal_type_id,
    p_description, p_location, p_landmark, p_division, p_district, p_upazila_or_thana,
    p_creator_on_site, p_last_seen_at
  )
  returning * into v_case;

  perform transition_case_status(v_case.id, 'submitted', auth.uid(), 'Case reported');
  v_case := transition_case_status(v_case.id, 'open', auth.uid(), 'Case published; matching begun');

  return v_case;
end;
$$;

revoke execute on function create_case(
  text, incident_type, urgency_level, uuid, text, geography, text, text, text, text, boolean, timestamptz
) from anon;
grant execute on function create_case(
  text, incident_type, urgency_level, uuid, text, geography, text, text, text, text, boolean, timestamptz
) to authenticated;
