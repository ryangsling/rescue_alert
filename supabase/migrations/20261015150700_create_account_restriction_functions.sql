-- MOD-006: warn, restrict, suspend, or ban an account; MOD-007:
-- audited. 'suspended' and 'banned' are the two levels this schema
-- actually enforces anywhere (profiles.is_suspended gates case
-- creation, response, and comments at RLS - AUTH-009); 'warning' and
-- 'restricted' are recorded consequences without an additional
-- enforcement surface, since the PRD does not specify one.
create or replace function issue_account_restriction(
  p_user_id uuid, p_restriction_type account_restriction_type, p_reason text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_restriction_id uuid;
  v_action moderation_action_type;
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'user_not_found: %', p_user_id;
  end if;

  insert into account_restrictions (user_id, restriction_type, reason, issued_by)
  values (p_user_id, p_restriction_type, p_reason, v_actor_id)
  returning id into v_restriction_id;

  if p_restriction_type in ('suspended', 'banned') then
    update profiles set is_suspended = true where id = p_user_id;
  end if;

  v_action := case p_restriction_type
    when 'warning' then 'warn_account'
    when 'restricted' then 'restrict_account'
    when 'suspended' then 'suspend_account'
    when 'banned' then 'ban_account'
  end;
  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (v_actor_id, v_action, 'profile', p_user_id, p_reason);

  return v_restriction_id;
end;
$$;

-- Lifting only clears profiles.is_suspended once no other active
-- suspend/ban restriction remains for the user.
create or replace function lift_account_restriction(p_restriction_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_restriction account_restrictions;
begin
  if not is_moderator_or_admin() then
    raise exception 'requires_moderator';
  end if;

  select * into v_restriction from account_restrictions where id = p_restriction_id;
  if not found then
    raise exception 'restriction_not_found: %', p_restriction_id;
  end if;
  if v_restriction.lifted_at is not null then
    raise exception 'restriction_already_lifted: %', p_restriction_id;
  end if;

  update account_restrictions
  set lifted_at = now(), lifted_by = v_actor_id
  where id = p_restriction_id;

  if v_restriction.restriction_type in ('suspended', 'banned')
     and not exists (
       select 1 from account_restrictions
       where user_id = v_restriction.user_id
         and restriction_type in ('suspended', 'banned')
         and lifted_at is null
         and id <> p_restriction_id
     )
  then
    update profiles set is_suspended = false where id = v_restriction.user_id;
  end if;

  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  values (v_actor_id, 'lift_restriction', 'profile', v_restriction.user_id, p_reason);
end;
$$;

revoke all on function issue_account_restriction(uuid, account_restriction_type, text) from public, anon;
revoke all on function lift_account_restriction(uuid, text) from public, anon;
grant execute on function issue_account_restriction(uuid, account_restriction_type, text) to authenticated;
grant execute on function lift_account_restriction(uuid, text) to authenticated;
