-- MOD-005 (redact personal information) and MOD-010 (abuse cases
-- involving people restrict sensitive location and identity
-- information) share one mechanism: clearing the free-text landmark
-- and flipping exact_location_visibility to 'restricted', which the
-- public view, feed, and case-list functions already honour (Part 3/9
-- - they all filter on exact_location_visibility = 'standard'). Free-
-- text case descriptions and comments are not surgically redacted
-- here; the hide-content functions (MOD-003) are the tool for content
-- that needs to come down entirely.
create or replace function redact_case_sensitive_info(p_case_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_before jsonb;
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;

  select jsonb_build_object('landmark', landmark, 'exact_location_visibility', exact_location_visibility)
    into v_before
    from rescue_cases where id = p_case_id;
  if v_before is null then
    raise exception 'case_not_found: %', p_case_id;
  end if;

  update rescue_cases
  set landmark = null, exact_location_visibility = 'restricted'
  where id = p_case_id;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (v_actor_id, 'redact_personal_info', 'case', p_case_id, p_reason);

  insert into audit_logs (actor_id, action, target_type, target_id, previous_value, new_value, reason)
  values (
    v_actor_id, 'redact_case_sensitive_info', 'case', p_case_id, v_before,
    jsonb_build_object('landmark', null, 'exact_location_visibility', 'restricted'), p_reason
  );
end;
$$;

revoke all on function redact_case_sensitive_info(uuid, text) from public, anon;
grant execute on function redact_case_sensitive_info(uuid, text) to authenticated;
