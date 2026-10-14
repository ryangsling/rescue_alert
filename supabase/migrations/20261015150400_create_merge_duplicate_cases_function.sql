-- MOD-004: merge a duplicate case into the surviving one, preserving
-- every reference from both. Conversation content, responses, needs,
-- media, contributions, watchers, and reports move onto the target;
-- the source case's own historical record (status history, location
-- history, any recorded outcome) stays attached to the source row,
-- which itself is kept (marked 'duplicate', pointing at the survivor
-- via merged_into_case_id) rather than deleted.
--
-- case_needs (unique on case_id, need_type), contributions (unique on
-- user_id, case_id, category), and case_watchers (pk on user_id,
-- case_id) can each collide with a row the target already has; a true
-- duplicate of that shape is dropped from the source side rather than
-- erroring, since the target's own row already represents it.
create or replace function merge_duplicate_cases(
  p_source_case_id uuid, p_target_case_id uuid, p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;
  if p_source_case_id = p_target_case_id then
    raise exception 'cannot_merge_case_into_itself';
  end if;
  if not exists (select 1 from rescue_cases where id = p_source_case_id) then
    raise exception 'source_case_not_found: %', p_source_case_id;
  end if;
  if not exists (select 1 from rescue_cases where id = p_target_case_id) then
    raise exception 'target_case_not_found: %', p_target_case_id;
  end if;

  update case_comments set case_id = p_target_case_id where case_id = p_source_case_id;
  update case_updates set case_id = p_target_case_id where case_id = p_source_case_id;
  update case_responses set case_id = p_target_case_id where case_id = p_source_case_id;
  update rescue_media set case_id = p_target_case_id where case_id = p_source_case_id;
  update content_reports set target_id = p_target_case_id
    where target_type = 'case' and target_id = p_source_case_id;

  delete from case_needs src
  using case_needs tgt
  where src.case_id = p_source_case_id and tgt.case_id = p_target_case_id
    and tgt.need_type = src.need_type;
  update case_needs set case_id = p_target_case_id where case_id = p_source_case_id;

  delete from contributions src
  using contributions tgt
  where src.case_id = p_source_case_id and tgt.case_id = p_target_case_id
    and tgt.user_id = src.user_id and tgt.category = src.category;
  update contributions set case_id = p_target_case_id where case_id = p_source_case_id;

  delete from case_watchers src
  using case_watchers tgt
  where src.case_id = p_source_case_id and tgt.case_id = p_target_case_id
    and tgt.user_id = src.user_id;
  update case_watchers set case_id = p_target_case_id where case_id = p_source_case_id;

  perform transition_case_status(p_source_case_id, 'duplicate', v_actor_id, p_reason);

  update rescue_cases set merged_into_case_id = p_target_case_id where id = p_source_case_id;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (v_actor_id, 'merge_duplicate', 'case', p_source_case_id, p_reason);
end;
$$;

revoke all on function merge_duplicate_cases(uuid, uuid, text) from public, anon;
grant execute on function merge_duplicate_cases(uuid, uuid, text) to authenticated;
