-- Part 11: the remaining notification categories (PRD 11.1), created by
-- triggers on the events that already exist.
--
-- Failure isolation: every trigger body is wrapped so an error inside
-- notification code becomes a warning and never aborts the write that
-- fired it (a case update, a status change, a moderation action).
--
-- Not covered, and why:
--   - Mentions: no mention syntax or parsing exists yet, so "reply or
--     mention" fires for replies and comments only.
--   - Response accepted: Part 12 builds the response flow; this fires on
--     any case_responses insert or change, so it works as soon as those
--     rows are written.

create or replace function notification_case_payload(p_case_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'incident_type', c.incident_type,
    'urgency', c.urgency,
    'area', coalesce(c.upazila_or_thana, c.district, c.division)
  )
  from rescue_cases c
  where c.id = p_case_id;
$$;

-- Everyone with a stake in a case: creator, coordinator, committed
-- responders, and watchers, minus the person who caused the event.
create or replace function case_audience(p_case_id uuid, p_actor uuid)
returns table (user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct u.id
  from (
    select c.creator_id as id from rescue_cases c where c.id = p_case_id
    union all
    select c.coordinator_id from rescue_cases c where c.id = p_case_id
    union all
    select r.responder_id from case_responses r
      where r.case_id = p_case_id and r.status in ('committed', 'confirmed')
    union all
    select w.user_id from case_watchers w where w.case_id = p_case_id
  ) u
  where u.id is not null and u.id is distinct from p_actor;
$$;

-- PRD 11.3: repeated updates on one case fold into the recipient's
-- unread notification from the last 30 minutes (count goes up) instead
-- of creating a new row and a new push. Only the four update-style
-- categories group; closures, follow-ups, and account notices never do.
create or replace function enqueue_notification(
  p_recipient_id uuid,
  p_case_id uuid,
  p_category notification_category,
  p_payload jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
begin
  if p_category in (
    'response_accepted_or_changed', 'official_case_update',
    'reply_or_mention', 'case_status_changed'
  ) then
    select id into v_existing
    from notifications
    where recipient_id = p_recipient_id
      and case_id is not distinct from p_case_id
      and category = p_category
      and read_at is null
      and created_at > now() - interval '30 minutes'
    order by created_at desc
    limit 1;
  end if;

  if v_existing is not null then
    update notifications
    set payload = payload || jsonb_build_object(
      'count', coalesce((payload->>'count')::integer, 1) + 1
    )
    where id = v_existing;
  else
    insert into notifications (recipient_id, case_id, category, payload)
    values (p_recipient_id, p_case_id, p_category, p_payload);
  end if;
end;
$$;

-- Status changes: closure, follow-up request, or a plain status change.
-- The first three statuses are part of publishing a case, and the
-- commitment status is already covered by the response notification.
create or replace function notify_case_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_recipient uuid;
begin
  begin
    if new.previous_status is null
       or new.new_status in ('draft', 'submitted', 'open', 'response_committed') then
      return new;
    end if;

    v_payload := notification_case_payload(new.case_id);

    if new.new_status = 'follow_up_required' then
      for v_recipient in
        select id from (
          select creator_id as id from rescue_cases where id = new.case_id
          union
          select coordinator_id from rescue_cases where id = new.case_id
        ) t where id is not null and id is distinct from new.actor_id
      loop
        perform enqueue_notification(v_recipient, new.case_id, 'follow_up_requested', v_payload);
      end loop;
    else
      for v_recipient in select user_id from case_audience(new.case_id, new.actor_id) loop
        perform enqueue_notification(
          v_recipient, new.case_id,
          case
            when new.new_status in (
              'resolved', 'closed', 'no_longer_found', 'cancelled_by_reporter',
              'closed_by_moderator'
            ) then 'case_closed'
            else 'case_status_changed'
          end::notification_category,
          v_payload
        );
      end loop;
    end if;
  exception when others then
    raise warning 'notify_case_status_changed failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_case_status_changed
  after insert on case_status_history
  for each row execute function notify_case_status_changed();

create or replace function notify_official_case_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_payload jsonb;
begin
  begin
    v_payload := notification_case_payload(new.case_id);
    for v_recipient in select user_id from case_audience(new.case_id, new.author_id) loop
      perform enqueue_notification(v_recipient, new.case_id, 'official_case_update', v_payload);
    end loop;
  exception when others then
    raise warning 'notify_official_case_update failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_official_case_update
  after insert on case_updates
  for each row execute function notify_official_case_update();

-- A comment notifies the case creator; a reply notifies the comment's
-- author. Hidden content notifies nobody.
create or replace function notify_comment_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
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
  exception when others then
    raise warning 'notify_comment_on_case failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_comment_on_case
  after insert on case_comments
  for each row execute function notify_comment_on_case();

create or replace function notify_reply_to_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment case_comments%rowtype;
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
  exception when others then
    raise warning 'notify_reply_to_comment failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_reply_to_comment
  after insert on comment_replies
  for each row execute function notify_reply_to_comment();

-- A responder committing, changing their assistance or ETA, or
-- withdrawing tells the case creator and coordinator.
create or replace function notify_response_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_payload jsonb;
begin
  begin
    if tg_op = 'UPDATE'
       and new.status = old.status
       and new.eta_at is not distinct from old.eta_at
       and new.assistance_types = old.assistance_types then
      return new;
    end if;

    v_payload := notification_case_payload(new.case_id);
    for v_recipient in
      select id from (
        select creator_id as id from rescue_cases where id = new.case_id
        union
        select coordinator_id from rescue_cases where id = new.case_id
      ) t where id is not null and id <> new.responder_id
    loop
      perform enqueue_notification(v_recipient, new.case_id, 'response_accepted_or_changed', v_payload);
    end loop;
  exception when others then
    raise warning 'notify_response_changed failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_response_changed
  after insert or update on case_responses
  for each row execute function notify_response_changed();

-- Account restrictions (issued or lifted) and moderator actions on a
-- case. The moderation_actions target_type for a case is 'case',
-- matching report_target_type.
create or replace function notify_account_restriction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if tg_op = 'INSERT' or (old.lifted_at is null and new.lifted_at is not null) then
      perform enqueue_notification(new.user_id, null, 'moderation_or_account', '{}');
    end if;
  exception when others then
    raise warning 'notify_account_restriction failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_account_restriction
  after insert or update of lifted_at on account_restrictions
  for each row execute function notify_account_restriction();

create or replace function notify_moderation_action_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
begin
  begin
    if new.target_type = 'case' then
      select creator_id into v_creator from rescue_cases where id = new.target_id;
      if v_creator is not null and v_creator <> new.moderator_id then
        perform enqueue_notification(v_creator, new.target_id, 'moderation_or_account', '{}');
      end if;
    end if;
  exception when others then
    raise warning 'notify_moderation_action_on_case failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_moderation_action_on_case
  after insert on moderation_actions
  for each row execute function notify_moderation_action_on_case();

revoke execute on function
  notification_case_payload(uuid),
  case_audience(uuid, uuid),
  enqueue_notification(uuid, uuid, notification_category, jsonb)
from public, anon, authenticated;

grant execute on function
  notification_case_payload(uuid),
  case_audience(uuid, uuid),
  enqueue_notification(uuid, uuid, notification_category, jsonb)
to service_role;

revoke execute on function
  notify_case_status_changed(),
  notify_official_case_update(),
  notify_comment_on_case(),
  notify_reply_to_comment(),
  notify_response_changed(),
  notify_account_restriction(),
  notify_moderation_action_on_case()
from public, anon, authenticated;
