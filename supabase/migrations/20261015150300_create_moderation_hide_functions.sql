-- MOD-003: hide content pending review, auditable (MOD-007). One
-- function per hideable table rather than a polymorphic dispatcher -
-- three short bodies, no shared abstraction worth the indirection.
create or replace function moderation_set_comment_hidden(
  p_comment_id uuid, p_hidden boolean, p_reason text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;
  if not exists (select 1 from case_comments where id = p_comment_id) then
    raise exception 'comment_not_found: %', p_comment_id;
  end if;

  update case_comments set is_hidden = p_hidden where id = p_comment_id;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (auth.uid(), 'hide_content', 'comment', p_comment_id, p_reason);
end;
$$;

create or replace function moderation_set_reply_hidden(
  p_reply_id uuid, p_hidden boolean, p_reason text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;
  if not exists (select 1 from comment_replies where id = p_reply_id) then
    raise exception 'reply_not_found: %', p_reply_id;
  end if;

  update comment_replies set is_hidden = p_hidden where id = p_reply_id;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (auth.uid(), 'hide_content', 'comment', p_reply_id, p_reason);
end;
$$;

create or replace function moderation_set_media_hidden(
  p_media_id uuid, p_hidden boolean, p_reason text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;
  if not exists (select 1 from rescue_media where id = p_media_id) then
    raise exception 'media_not_found: %', p_media_id;
  end if;

  update rescue_media set is_hidden = p_hidden where id = p_media_id;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (auth.uid(), 'hide_content', 'media', p_media_id, p_reason);
end;
$$;

revoke all on function moderation_set_comment_hidden(uuid, boolean, text) from public, anon;
revoke all on function moderation_set_reply_hidden(uuid, boolean, text) from public, anon;
revoke all on function moderation_set_media_hidden(uuid, boolean, text) from public, anon;
grant execute on function moderation_set_comment_hidden(uuid, boolean, text) to authenticated;
grant execute on function moderation_set_reply_hidden(uuid, boolean, text) to authenticated;
grant execute on function moderation_set_media_hidden(uuid, boolean, text) to authenticated;
