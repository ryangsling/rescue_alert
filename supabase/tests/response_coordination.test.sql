-- Part 12 tests: response commitment rules, coordinator transitions,
-- the needs board syncing itself, and comment mentions.
-- Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('rc_creator');
select pg_temp.mk_user('rc_coordinator');
select pg_temp.mk_user('rc_responder_a');
select pg_temp.mk_user('rc_responder_b');
select pg_temp.mk_user('rc_bystander');
\o

-- 1. A responder may only insert their own row, and it must start
-- committed and unconfirmed - a client cannot self-confirm on insert.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  begin
    call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
      'insert into case_responses (case_id, responder_id, assistance_types) values (%L, %L, array[''on_site_rescue'']::assistance_type[])',
      v_case, pg_temp.uid('rc_responder_b')));
    assert false, 'must not be able to respond on another user''s behalf';
  exception when insufficient_privilege then null;
  end;

  begin
    call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
      'insert into case_responses (case_id, responder_id, assistance_types, status) values (%L, %L, array[''on_site_rescue'']::assistance_type[], ''confirmed'')',
      v_case, pg_temp.uid('rc_responder_a')));
    assert false, 'must not be able to self-confirm on insert';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- 2. Cannot respond to a case that is not open or response_committed.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  update rescue_cases set status = 'closed' where id = v_case;
  begin
    perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));
    assert false, 'must not accept a response to a closed case';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- 3. One live commitment per responder per case; re-committing after
-- withdrawal is a fresh row, not a conflict.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));
  begin
    perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));
    assert false, 'must not allow a second live commitment from the same responder';
  exception when unique_violation then null;
  end;

  call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
    'update case_responses set status = ''withdrawn'', withdrawal_reason = ''changed my mind'' where case_id = %L and responder_id = %L',
    v_case, pg_temp.uid('rc_responder_a')));
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));
  assert (select count(*) from case_responses where case_id = v_case and responder_id = pg_temp.uid('rc_responder_a')) = 2,
    're-committing after withdrawal must insert a fresh row';
end $$;

-- 4. Withdrawal requires a reason, and a responder cannot jump their
-- own status to a coordinator-only value.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));

  begin
    call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
      'update case_responses set status = ''withdrawn'' where case_id = %L and responder_id = %L',
      v_case, pg_temp.uid('rc_responder_a')));
    assert false, 'withdrawal without a reason must be rejected';
  exception when check_violation then null;
  end;

  begin
    call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
      'update case_responses set status = ''confirmed'' where case_id = %L and responder_id = %L',
      v_case, pg_temp.uid('rc_responder_a')));
    assert false, 'a responder must not self-confirm';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 5. Only the creator/coordinator/moderator may confirm, and only
-- within the allowed transitions; they may not touch the responder's
-- own offer details.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));

  -- RLS filters the bystander's update to zero matching rows rather
  -- than raising, so the real assertion is that nothing changed.
  call pg_temp.as_user(pg_temp.uid('rc_bystander'), format(
    'update case_responses set status = ''confirmed'' where case_id = %L and responder_id = %L',
    v_case, pg_temp.uid('rc_responder_a')));
  assert (select status from case_responses where case_id = v_case and responder_id = pg_temp.uid('rc_responder_a')) = 'committed',
    'an unrelated user must not be able to confirm a response';

  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'update case_responses set status = ''confirmed'' where case_id = %L and responder_id = %L',
    v_case, pg_temp.uid('rc_responder_a')));
  assert (select confirmed_by from case_responses where case_id = v_case and responder_id = pg_temp.uid('rc_responder_a'))
    = pg_temp.uid('rc_creator'), 'confirmed_by must be stamped to the confirming actor, not trusted from the client';

  begin
    call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
      'update case_responses set status = ''completed'', assistance_types = array[''transport'']::assistance_type[] where case_id = %L and responder_id = %L',
      v_case, pg_temp.uid('rc_responder_a')));
    assert false, 'a coordinator must not edit the responder''s own offer details';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 6. The needs board follows confirmation and reopens if the
-- confirmed responder is later declined.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  insert into case_needs (case_id, need_type) values (v_case, 'transport');
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'), array['transport']::assistance_type[]);

  assert not (select is_fulfilled from case_needs where case_id = v_case and need_type = 'transport'),
    'a committed-only response must not fulfil the need yet';

  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'update case_responses set status = ''confirmed'' where case_id = %L and responder_id = %L',
    v_case, pg_temp.uid('rc_responder_a')));
  assert (select is_fulfilled from case_needs where case_id = v_case and need_type = 'transport'),
    'confirming the matching response must fulfil the need';

  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'update case_responses set status = ''declined'' where case_id = %L and responder_id = %L',
    v_case, pg_temp.uid('rc_responder_a')));
  assert not (select is_fulfilled from case_needs where case_id = v_case and need_type = 'transport'),
    'declining a previously confirmed response must reopen the need';
  assert (select fulfilled_by_response_id from case_needs where case_id = v_case and need_type = 'transport') is null;
end $$;

-- 7. Two responders committing to the same case both persist - no
-- lost update, since each is its own row under its own responder.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'), array['on_site_rescue']::assistance_type[]);
  perform pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_b'), array['transport']::assistance_type[]);
  assert (select count(*) from case_responses where case_id = v_case) = 2,
    'two distinct responders must both persist their commitment';
end $$;

-- 8. Mentions: extraction is exact, and a mentioned participant is
-- notified distinctly from the comment author and the case creator.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
begin
  assert extract_mentions(
    'hey @[Responder A](' || pg_temp.uid('rc_responder_a') || ') and @[not a real mention]'
  ) = array[pg_temp.uid('rc_responder_a')], 'extract_mentions must find exactly the well-formed token';

  call pg_temp.as_user(pg_temp.uid('rc_responder_b'), format(
    'insert into case_comments (case_id, author_id, body) values (%L, %L, %L)',
    v_case, pg_temp.uid('rc_responder_b'),
    'cc @[Responder A](' || pg_temp.uid('rc_responder_a') || ')'));

  assert exists (
    select 1 from notifications
    where recipient_id = pg_temp.uid('rc_responder_a') and case_id = v_case and category = 'reply_or_mention'
  ), 'a mentioned participant must be notified';
  assert not exists (
    select 1 from notifications
    where recipient_id = pg_temp.uid('rc_responder_b') and case_id = v_case and category = 'reply_or_mention'
  ), 'the comment author is never notified of their own mention';
end $$;

-- 9. A reply can be reported distinctly from the comment it replies to.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
  v_comment uuid;
begin
  call pg_temp.as_user(pg_temp.uid('rc_responder_a'), format(
    'insert into case_comments (case_id, author_id, body) values (%L, %L, %L)',
    v_case, pg_temp.uid('rc_responder_a'), 'original comment'));
  select id into v_comment from case_comments where case_id = v_case;

  call pg_temp.as_user(pg_temp.uid('rc_responder_b'), format(
    'insert into comment_replies (comment_id, author_id, body) values (%L, %L, %L)',
    v_comment, pg_temp.uid('rc_responder_b'), 'a reply'));

  call pg_temp.as_user(pg_temp.uid('rc_bystander'), format(
    'insert into content_reports (reporter_id, target_type, target_id, reason) values (%L, ''reply'', %L, ''harassment'')',
    pg_temp.uid('rc_bystander'), v_comment));

  assert exists (select 1 from content_reports where target_type = 'reply'), 'reply reports must use their own target_type';
end $$;

-- 10. get_responder_phone: a phone number is exposed only once a
-- response is accepted, and only to the case creator/coordinator/
-- moderator - never to a bystander, and never for a merely committed
-- offer. user_private_details is owner-only RLS, so this function is
-- the only path; mk_user seeds every test user with the same test
-- phone, so a non-null, matching result proves the join actually ran.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('rc_creator'), 'critical');
  v_response uuid := pg_temp.mk_response(v_case, pg_temp.uid('rc_responder_a'));
begin
  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'create temp table if not exists phone_probe as select get_responder_phone(%L) as phone', v_response));
  assert (select phone from phone_probe) is null, 'a merely committed offer must not expose a phone number yet';
  drop table phone_probe;

  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'update case_responses set status = ''confirmed'' where id = %L', v_response));

  call pg_temp.as_user(pg_temp.uid('rc_bystander'), format(
    'create temp table if not exists phone_probe as select get_responder_phone(%L) as phone', v_response));
  assert (select phone from phone_probe) is null, 'a bystander must never see a responder''s phone';
  drop table phone_probe;

  call pg_temp.as_user(pg_temp.uid('rc_creator'), format(
    'create temp table if not exists phone_probe as select get_responder_phone(%L) as phone', v_response));
  assert (select phone from phone_probe) = '+8801711223344', 'the creator must see an accepted responder''s phone';
  drop table phone_probe;
end $$;
