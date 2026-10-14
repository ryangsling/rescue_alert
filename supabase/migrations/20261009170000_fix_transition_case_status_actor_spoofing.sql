-- Real security bug found while building Part 13 (case closure):
-- transition_case_status() trusted a client-supplied p_actor_id with
-- no check that it matched the real caller. Confirmed live: anon and
-- authenticated both had EXECUTE on this function (default
-- privileges, the same pattern fixed repeatedly elsewhere in this
-- project for new functions). Any caller - including anon - could
-- pass an arbitrary actor id (e.g. a moderator's) to satisfy the
-- requires_moderator gate and to forge case_status_history.actor_id,
-- impersonating someone else's action. The project's own established
-- rule is that a trusted actor field is "stamped from auth.uid(),
-- never trusted from the client" (see case_responses' confirmed_by);
-- this function never applied that rule to itself.
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
  if p_actor_id is distinct from auth.uid() then
    raise exception 'actor_mismatch: p_actor_id must be the calling user';
  end if;

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

  perform set_config('rescue_alert.allow_status_change', 'true', true);

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

revoke all on function transition_case_status(uuid, case_status, uuid, text) from public, anon;
grant execute on function transition_case_status(uuid, case_status, uuid, text) to authenticated;
