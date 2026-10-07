-- Part 11 tests: the event-driven notification categories, grouping,
-- and failure isolation. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('ev_creator');
select pg_temp.mk_vol('ev_watcher', 5000);
select pg_temp.mk_vol('ev_responder', 5000);
select pg_temp.mk_vol('ev_bystander', 5000);
\o

create function pg_temp.count_for(p_user text, p_case uuid, p_category notification_category)
returns integer language sql as $$
  select count(*)::integer from notifications
  where recipient_id = pg_temp.uid(p_user) and case_id = p_case and category = p_category
$$;

do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('ev_creator'), 'critical');
begin
  insert into case_watchers (user_id, case_id) values (pg_temp.uid('ev_watcher'), v_case);
  perform pg_temp.mk_response(v_case, pg_temp.uid('ev_responder'));

  -- publishing the case (draft, submitted, open) notifies nobody
  assert (select count(*) from notifications where recipient_id = pg_temp.uid('ev_creator')
          and category = 'case_status_changed') = 0, 'publishing must not notify';

  -- a response tells the creator, and later changes fold into one row
  assert pg_temp.count_for('ev_creator', v_case, 'response_accepted_or_changed') = 1;
  call pg_temp.as_user(pg_temp.uid('ev_responder'),
    format('update case_responses set eta_at = now() + interval ''30 minutes'' where case_id = %L', v_case));
  assert pg_temp.count_for('ev_creator', v_case, 'response_accepted_or_changed') = 1, 'response changes group';
  assert (select (payload->>'count')::int from notifications
          where recipient_id = pg_temp.uid('ev_creator') and category = 'response_accepted_or_changed') = 2;
  call pg_temp.as_user(pg_temp.uid('ev_responder'),
    format('update case_responses set updated_at = now() where case_id = %L', v_case));
  assert (select (payload->>'count')::int from notifications
          where recipient_id = pg_temp.uid('ev_creator') and category = 'response_accepted_or_changed') = 2,
    'an unrelated column change is not a response change';

  -- official update: audience is watcher and responder, never the author
  insert into case_updates (case_id, author_id, body) values (v_case, pg_temp.uid('ev_creator'), 'first');
  assert pg_temp.count_for('ev_watcher', v_case, 'official_case_update') = 1;
  assert pg_temp.count_for('ev_responder', v_case, 'official_case_update') = 1;
  assert pg_temp.count_for('ev_creator', v_case, 'official_case_update') = 0, 'author is not notified of own update';
  assert pg_temp.count_for('ev_bystander', v_case, 'official_case_update') = 0, 'non-participants are not notified';

  -- repeated updates group into one notification with a running count
  insert into case_updates (case_id, author_id, body) values (v_case, pg_temp.uid('ev_creator'), 'second');
  insert into case_updates (case_id, author_id, body) values (v_case, pg_temp.uid('ev_creator'), 'third');
  assert pg_temp.count_for('ev_watcher', v_case, 'official_case_update') = 1, 'grouped into one row';
  assert (select (payload->>'count')::int from notifications
          where recipient_id = pg_temp.uid('ev_watcher') and category = 'official_case_update') = 3;

  -- once read, the next update starts a fresh notification
  update notifications set read_at = now()
    where recipient_id = pg_temp.uid('ev_watcher') and category = 'official_case_update';
  insert into case_updates (case_id, author_id, body) values (v_case, pg_temp.uid('ev_creator'), 'fourth');
  assert pg_temp.count_for('ev_watcher', v_case, 'official_case_update') = 2;

  -- comments and replies
  declare v_comment uuid;
  begin
    insert into case_comments (case_id, author_id, body)
      values (v_case, pg_temp.uid('ev_watcher'), 'hello') returning id into v_comment;
    assert pg_temp.count_for('ev_creator', v_case, 'reply_or_mention') = 1, 'a comment notifies the creator';
    insert into comment_replies (comment_id, author_id, body)
      values (v_comment, pg_temp.uid('ev_creator'), 'thanks');
    assert pg_temp.count_for('ev_watcher', v_case, 'reply_or_mention') = 1, 'a reply notifies the comment author';
    insert into case_comments (case_id, author_id, body, is_hidden)
      values (v_case, pg_temp.uid('ev_bystander'), 'hidden', true);
    assert pg_temp.count_for('ev_creator', v_case, 'reply_or_mention') = 1, 'hidden comments notify nobody';
  end;

  -- status changes
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_creator'), 'open', 'response_committed');
  assert pg_temp.count_for('ev_watcher', v_case, 'case_status_changed') = 0, 'commitment is covered by the response notification';
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_creator'), 'response_committed', 'rescue_in_progress');
  assert pg_temp.count_for('ev_watcher', v_case, 'case_status_changed') = 1;
  assert pg_temp.count_for('ev_creator', v_case, 'case_status_changed') = 0, 'the actor is not notified';
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_responder'), 'rescue_in_progress', 'follow_up_required');
  assert pg_temp.count_for('ev_creator', v_case, 'follow_up_requested') = 1, 'follow-up goes to the creator';
  assert pg_temp.count_for('ev_watcher', v_case, 'follow_up_requested') = 0, 'follow-up is not broadcast to watchers';
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_creator'), 'follow_up_required', 'closed');
  assert pg_temp.count_for('ev_watcher', v_case, 'case_closed') = 1;
  assert pg_temp.count_for('ev_responder', v_case, 'case_closed') = 1;

  -- account and moderation notices
  insert into account_restrictions (user_id, restriction_type, reason, issued_by)
    values (pg_temp.uid('ev_bystander'), 'warning', 'test', pg_temp.uid('ev_creator'));
  assert (select count(*) from notifications where recipient_id = pg_temp.uid('ev_bystander')
          and category = 'moderation_or_account') = 1;
  update account_restrictions set lifted_at = now() where user_id = pg_temp.uid('ev_bystander');
  assert (select count(*) from notifications where recipient_id = pg_temp.uid('ev_bystander')
          and category = 'moderation_or_account') = 2, 'lifting a restriction notifies too';
  insert into moderation_actions (moderator_id, action_type, target_type, target_id, reason)
    values (pg_temp.uid('ev_bystander'), 'redact_personal_info', 'case', v_case, 'test');
  assert pg_temp.count_for('ev_creator', v_case, 'moderation_or_account') = 1;
end $$;

-- Nothing here may carry coordinates or contact details.
do $$
begin
  assert not exists (
    select 1 from notifications n
    where n.recipient_id in (select id from names where name like 'ev\_%')
      and (select coalesce(array_agg(k), '{}') from jsonb_object_keys(n.payload) k)
          <@ array['incident_type', 'urgency', 'area', 'count'] is not true
  ), 'event payloads may only carry template inputs';
end $$;

-- Closure notices still reach devices after the case is closed, unlike
-- nearby alerts, which stop.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('ev_creator'), 'urgent');
begin
  insert into case_watchers (user_id, case_id) values (pg_temp.uid('ev_watcher'), v_case);
  update rescue_cases set status = 'closed' where id = v_case;
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_creator'), 'open', 'closed');
  perform queue_notification_deliveries();
  assert exists (
    select 1 from notification_deliveries d join notifications n on n.id = d.notification_id
    where n.case_id = v_case and n.category = 'case_closed' and n.recipient_id = pg_temp.uid('ev_watcher')
  ), 'a closure notice must be pushed even though the case is closed';
end $$;

-- A notification failure never undoes the write that triggered it.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('ev_creator'), 'critical');
begin
  insert into case_watchers (user_id, case_id) values (pg_temp.uid('ev_watcher'), v_case);
  alter table notifications add constraint force_failure check (false) not valid;

  insert into case_updates (case_id, author_id, body) values (v_case, pg_temp.uid('ev_creator'), 'survives');
  insert into case_status_history (case_id, actor_id, previous_status, new_status)
    values (v_case, pg_temp.uid('ev_creator'), 'open', 'closed');

  assert exists (select 1 from case_updates where case_id = v_case and body = 'survives'),
    'the official update must still be saved';
  assert exists (select 1 from case_status_history where case_id = v_case and new_status = 'closed'),
    'the status change must still be recorded';
  assert not exists (select 1 from notifications where case_id = v_case), 'and no notification was created';

  alter table notifications drop constraint force_failure;
end $$;
