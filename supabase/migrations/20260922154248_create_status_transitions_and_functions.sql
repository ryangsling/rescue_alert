
-- The legal case-status graph, as data rather than a hardcoded
-- conditional ladder, so it can be inspected and extended without
-- touching function code. requires_moderator gates transitions that
-- are moderator/administrator-only (OUT-005 reopen, MOD-003/MOD-004
-- style outcomes) as a defense-in-depth check inside the function
-- itself, independent of RLS.
create table case_status_transitions (
  from_status case_status not null,
  to_status case_status not null,
  requires_moderator boolean not null default false,
  primary key (from_status, to_status)
);

insert into case_status_transitions (from_status, to_status, requires_moderator) values
  ('draft', 'submitted', false),
  ('draft', 'cancelled_by_reporter', false),
  ('submitted', 'under_review', false),
  ('submitted', 'open', false),
  ('submitted', 'duplicate', true),
  ('submitted', 'false_report', true),
  ('submitted', 'spam', true),
  ('submitted', 'unsafe_or_prohibited_content', true),
  ('submitted', 'cancelled_by_reporter', false),
  ('under_review', 'open', false),
  ('under_review', 'duplicate', true),
  ('under_review', 'false_report', true),
  ('under_review', 'spam', true),
  ('under_review', 'unsafe_or_prohibited_content', true),
  ('under_review', 'closed_by_moderator', true),
  ('open', 'response_committed', false),
  ('open', 'no_longer_found', false),
  ('open', 'cancelled_by_reporter', false),
  ('open', 'duplicate', true),
  ('open', 'resolved', false),
  ('open', 'closed', false),
  ('open', 'closed_by_moderator', true),
  ('response_committed', 'responder_en_route', false),
  ('response_committed', 'open', false),
  ('response_committed', 'no_longer_found', false),
  ('response_committed', 'resolved', false),
  ('response_committed', 'closed', false),
  ('response_committed', 'closed_by_moderator', true),
  ('responder_en_route', 'animal_located', false),
  ('responder_en_route', 'response_committed', false),
  ('responder_en_route', 'no_longer_found', false),
  ('responder_en_route', 'resolved', false),
  ('responder_en_route', 'closed', false),
  ('responder_en_route', 'closed_by_moderator', true),
  ('animal_located', 'rescue_in_progress', false),
  ('animal_located', 'no_longer_found', false),
  ('animal_located', 'resolved', false),
  ('animal_located', 'closed', false),
  ('animal_located', 'closed_by_moderator', true),
  ('rescue_in_progress', 'transporting', false),
  ('rescue_in_progress', 'at_clinic_foster_shelter', false),
  ('rescue_in_progress', 'resolved', false),
  ('rescue_in_progress', 'closed', false),
  ('rescue_in_progress', 'closed_by_moderator', true),
  ('transporting', 'at_clinic_foster_shelter', false),
  ('transporting', 'resolved', false),
  ('transporting', 'closed', false),
  ('transporting', 'closed_by_moderator', true),
  ('at_clinic_foster_shelter', 'follow_up_required', false),
  ('at_clinic_foster_shelter', 'resolved', false),
  ('at_clinic_foster_shelter', 'closed', false),
  ('at_clinic_foster_shelter', 'closed_by_moderator', true),
  ('follow_up_required', 'resolved', false),
  ('follow_up_required', 'closed', false),
  ('follow_up_required', 'closed_by_moderator', true),
  ('resolved', 'closed', false),
  ('resolved', 'follow_up_required', false),
  ('resolved', 'closed_by_moderator', true),
  ('closed', 'open', true),
  ('no_longer_found', 'open', false),
  ('no_longer_found', 'closed', false),
  ('no_longer_found', 'closed_by_moderator', true),
  ('duplicate', 'open', true),
  ('false_report', 'open', true),
  ('spam', 'open', true),
  ('unsafe_or_prohibited_content', 'open', true),
  ('cancelled_by_reporter', 'open', true),
  ('closed_by_moderator', 'open', true);

create or replace function transition_case_status(
  p_case_id uuid,
  p_new_status case_status,
  p_actor_id uuid,
  p_reason text default null
) returns rescue_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case rescue_cases;
  v_actor profiles;
  v_edge case_status_transitions;
begin
  select * into v_case from rescue_cases where id = p_case_id for update;
  if not found then
    raise exception 'case_not_found: %', p_case_id;
  end if;

  select * into v_actor from profiles where id = p_actor_id;
  if not found then
    raise exception 'actor_not_found: %', p_actor_id;
  end if;
  if v_actor.is_suspended then
    raise exception 'actor_suspended: %', p_actor_id;
  end if;

  select * into v_edge
    from case_status_transitions
    where from_status = v_case.status and to_status = p_new_status;
  if not found then
    raise exception 'illegal_status_transition: % -> %', v_case.status, p_new_status;
  end if;

  if v_edge.requires_moderator and v_actor.role not in ('moderator', 'administrator') then
    raise exception 'requires_moderator: % -> % by role %', v_case.status, p_new_status, v_actor.role;
  end if;

  update rescue_cases
  set
    status = p_new_status,
    updated_at = now(),
    closed_at = case when p_new_status in ('closed', 'closed_by_moderator') then now() else closed_at end
  where id = p_case_id
  returning * into v_case;

  insert into case_status_history (case_id, actor_id, previous_status, new_status, reason)
  values (p_case_id, p_actor_id, v_edge.from_status, p_new_status, p_reason);

  return v_case;
end;
$$;

comment on function transition_case_status is 'The only sanctioned way to change rescue_cases.status. Validates against case_status_transitions, enforces the moderator gate, and writes case_status_history atomically.';

-- Approximate location is always server-derived: snapping to
-- ~0.001 degrees (~100m at Bangladesh latitudes) masks the exact
-- point while keeping the case in the right neighbourhood for the
-- nearby feed and map. A client-supplied approximate_location is
-- always overwritten.
create or replace function derive_approximate_location() returns trigger
language plpgsql as $$
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

create trigger rescue_cases_derive_approximate_location
  before insert or update of location on rescue_cases
  for each row execute function derive_approximate_location();

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger rescue_cases_set_updated_at
  before update on rescue_cases
  for each row execute function set_updated_at();

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger case_responses_set_updated_at
  before update on case_responses
  for each row execute function set_updated_at();
