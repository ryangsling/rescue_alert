-- Part 12: response and coordination rules.
--
-- case_responses already has RLS letting a responder touch their own
-- row and letting the creator/coordinator/moderator touch any row for
-- the case (Part 1). That table-level policy cannot express *which*
-- columns or status values each of those roles may actually write, so
-- this migration adds a trigger that does - the same layered pattern
-- already used on profiles (prevent_self_role_escalation,
-- prevent_self_verification): RLS decides who may touch the row at
-- all, the trigger decides what they are allowed to change.

alter table case_responses
  add constraint withdrawal_reason_required_when_withdrawn
  check (status <> 'withdrawn' or (withdrawal_reason is not null and length(trim(withdrawal_reason)) > 0));

-- RESP-005: distinct responders never conflict, but the same
-- responder cannot hold two live commitments on one case. A withdrawn
-- or declined row falls outside this index, so re-committing after
-- withdrawal inserts a fresh row rather than failing.
create unique index case_responses_one_active_per_responder_idx
  on case_responses (case_id, responder_id)
  where status in ('committed', 'confirmed');

create or replace function enforce_case_response_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_is_coordinator boolean;
  v_is_responder boolean;
begin
  if tg_op = 'INSERT' then
    if new.responder_id <> auth.uid() then
      raise exception 'responder_id must be the caller' using errcode = '42501';
    end if;
    if new.status <> 'committed' or new.confirmed_by is not null then
      raise exception 'a new response must start committed and unconfirmed' using errcode = '22023';
    end if;
    if not exists (
      select 1 from rescue_cases
      where id = new.case_id and status in ('open', 'response_committed')
    ) then
      raise exception 'this case is not open for a new response' using errcode = '22023';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.case_id <> old.case_id or new.responder_id <> old.responder_id then
    raise exception 'case_id and responder_id cannot change' using errcode = '42501';
  end if;

  v_is_coordinator := is_case_creator(old.case_id) or is_case_coordinator(old.case_id) or is_moderator_or_admin();
  v_is_responder := auth.uid() = old.responder_id;

  if v_is_coordinator then
    if new.assistance_types <> old.assistance_types
       or new.eta_at is distinct from old.eta_at
       or new.availability_note is distinct from old.availability_note then
      raise exception 'only the responder may change their own offer details' using errcode = '42501';
    end if;
    if old.status not in ('committed', 'confirmed')
       or new.status not in ('confirmed', 'completed', 'declined', 'unresponsive') then
      raise exception 'invalid coordinator status transition' using errcode = '22023';
    end if;
    new.confirmed_by := auth.uid();
  elsif v_is_responder then
    if new.status is distinct from old.status then
      if old.status not in ('committed', 'confirmed') or new.status <> 'withdrawn' then
        raise exception 'a responder may only withdraw their own commitment' using errcode = '42501';
      end if;
    else
      if old.status <> 'committed' then
        raise exception 'offer details can only be edited while committed' using errcode = '22023';
      end if;
    end if;
    new.confirmed_by := old.confirmed_by;
  else
    raise exception 'not authorized to modify this response' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger enforce_case_response_rules
  before insert or update on case_responses
  for each row execute function enforce_case_response_rules();

-- RESP-006: the needs board reflects reality on its own as responses
-- move. A response that reaches confirmed/completed claims any
-- not-yet-fulfilled need matching one of its assistance types; a
-- response that moves away from confirmed (declined, unresponsive, or
-- withdrawn) releases whatever it had claimed, so the need reopens.
-- "completed" never releases - the help was already given.
create or replace function sync_case_needs_from_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('confirmed', 'completed') and old.status not in ('confirmed', 'completed') then
    update case_needs
    set is_fulfilled = true, fulfilled_by_response_id = new.id
    where case_id = new.case_id
      and need_type = any (new.assistance_types)
      and not is_fulfilled;
  elsif old.status in ('confirmed', 'completed') and new.status not in ('confirmed', 'completed') then
    update case_needs
    set is_fulfilled = false, fulfilled_by_response_id = null
    where fulfilled_by_response_id = new.id;
  end if;
  return new;
end;
$$;

create trigger sync_case_needs_from_response
  after update of status on case_responses
  for each row execute function sync_case_needs_from_response();

-- COMM-004-ish: mentions. The composer inserts a @[Display Name](uuid)
-- token when someone picks a participant from the mention list;
-- malformed or unknown ids are simply ignored rather than erroring, so
-- a comment can never fail to post over a mention problem.
create or replace function extract_mentions(p_body text)
returns uuid[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct m[1]::uuid), array[]::uuid[])
  from regexp_matches(p_body, '@\[[^\]]*\]\(([0-9a-fA-F-]{36})\)', 'g') as m
  where m[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$$;

create or replace function notify_comment_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_mentioned uuid;
begin
  begin
    if new.is_hidden then
      return new;
    end if;
    select creator_id into v_creator from rescue_cases where id = new.case_id;
    if v_creator is not null and v_creator <> new.author_id then
      perform enqueue_notification(
        v_creator, new.case_id, 'reply_or_mention', notification_case_payload(new.case_id)
      );
    end if;
    for v_mentioned in
      select m from unnest(extract_mentions(new.body)) m
      where m <> new.author_id and exists (select 1 from profiles where id = m)
    loop
      perform enqueue_notification(
        v_mentioned, new.case_id, 'reply_or_mention', notification_case_payload(new.case_id)
      );
    end loop;
  exception when others then
    raise warning 'notify_comment_on_case failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function notify_reply_to_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment case_comments%rowtype;
  v_mentioned uuid;
begin
  begin
    if new.is_hidden then
      return new;
    end if;
    select * into v_comment from case_comments where id = new.comment_id;
    if found and v_comment.author_id <> new.author_id then
      perform enqueue_notification(
        v_comment.author_id, v_comment.case_id, 'reply_or_mention',
        notification_case_payload(v_comment.case_id)
      );
    end if;
    if found then
      for v_mentioned in
        select m from unnest(extract_mentions(new.body)) m
        where m <> new.author_id and exists (select 1 from profiles where id = m)
      loop
        perform enqueue_notification(
          v_mentioned, v_comment.case_id, 'reply_or_mention',
          notification_case_payload(v_comment.case_id)
        );
      end loop;
    end if;
  exception when others then
    raise warning 'notify_reply_to_comment failed: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke execute on function extract_mentions(text) from public, anon, authenticated;
grant execute on function extract_mentions(text) to service_role, authenticated;

-- A reply is reported distinctly from the comment it replies to -
-- moderation code resolving content_reports already switches on
-- target_type (see its own comment), so this is additive, not a
-- behaviour change for the existing case/comment/profile/media values.
alter type report_target_type add value if not exists 'reply';
