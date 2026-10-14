-- Part 15 tests: hide content, merge duplicates, redact sensitive
-- info, account restrictions, and appeals. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('mod');
select pg_temp.mk_user('creator');
select pg_temp.mk_user('bystander');
update profiles set role = 'moderator' where id = pg_temp.uid('mod');
\o

-- 1. Hiding a comment actually hides it (regression test for the Part
-- 1 bug: is_hidden existed but SELECT never checked it).
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_comment_id uuid;
begin
  call pg_temp.as_user(pg_temp.uid('creator'),
    format('insert into case_comments (case_id, author_id, body) values (%L, %L, %L)',
      v_case, pg_temp.uid('creator'), 'hello'));
  select id into v_comment_id from case_comments where case_id = v_case;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  assert exists (select 1 from case_comments where id = v_comment_id),
    'a visible comment is readable before being hidden';
  reset role;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform moderation_set_comment_hidden(v_comment_id, true, 'spam');
  reset role;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  assert not exists (select 1 from case_comments where id = v_comment_id),
    'a hidden comment must not be visible to a bystander';
  reset role;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('creator')::text, true);
  set local role authenticated;
  assert exists (select 1 from case_comments where id = v_comment_id),
    'the author may still see their own hidden comment';
  reset role;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  assert exists (select 1 from case_comments where id = v_comment_id),
    'a moderator may still see a hidden comment';
  reset role;

  assert exists (
    select 1 from moderation_actions
    where action_type = 'hide_content' and target_type = 'comment' and target_id = v_comment_id
  ), 'hiding a comment is audited';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  begin
    perform moderation_set_comment_hidden(v_comment_id, true, 'spam');
    assert false, 'a non-moderator must not be able to hide a comment';
  exception when others then
    assert sqlerrm like '%requires_moderator%', 'unexpected error: ' || sqlerrm;
  end;
  reset role;
end $$;

-- 2. Hiding media likewise.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_media_id uuid;
begin
  call pg_temp.as_user(pg_temp.uid('creator'),
    format('insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped) values (%L, %L, %L, true)',
      v_case, pg_temp.uid('creator'), 'cases/test.jpg'));
  select id into v_media_id from rescue_media where case_id = v_case;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform moderation_set_media_hidden(v_media_id, true, 'graphic content pending review');
  reset role;

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  assert not exists (select 1 from rescue_media where id = v_media_id),
    'hidden media must not be visible to a bystander';
  reset role;
end $$;

-- 3. merge_duplicate_cases preserves references from both cases and
-- drops only true duplicates of a (case_id, need_type)/(user,category)
-- shaped row.
do $$
declare
  v_source uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_target uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_comment_id uuid;
begin
  call pg_temp.as_user(pg_temp.uid('creator'),
    format('insert into case_comments (case_id, author_id, body) values (%L, %L, %L)',
      v_source, pg_temp.uid('creator'), 'on the source case'));
  select id into v_comment_id from case_comments where case_id = v_source;

  insert into case_needs (case_id, need_type) values (v_source, 'on_site_rescue'), (v_source, 'transport');
  insert into case_needs (case_id, need_type) values (v_target, 'on_site_rescue');

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform merge_duplicate_cases(v_source, v_target, 'same incident reported twice');
  reset role;

  assert (select status from rescue_cases where id = v_source) = 'duplicate',
    'the source case is marked duplicate';
  assert (select merged_into_case_id from rescue_cases where id = v_source) = v_target,
    'the source case records which case it was merged into';
  assert (select case_id from case_comments where id = v_comment_id) = v_target,
    'the comment moved onto the surviving case';
  assert (select count(*) from case_needs where case_id = v_target) = 2,
    'needs merge without duplicating the shared on_site_rescue row';
  assert (select count(*) from case_needs where case_id = v_source) = 0,
    'no needs remain attached to the merged-away case';

  assert exists (
    select 1 from moderation_actions
    where action_type = 'merge_duplicate' and target_type = 'case' and target_id = v_source
  ), 'merging is audited';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  begin
    perform merge_duplicate_cases(v_target, v_source, 'trying again');
    assert false, 'a non-moderator must not be able to merge cases';
  exception when others then
    assert sqlerrm like '%requires_moderator%', 'unexpected error: ' || sqlerrm;
  end;
  reset role;
end $$;

-- 4. redact_case_sensitive_info clears the landmark and restricts
-- exact-location visibility, auditing both tables.
do $$
declare v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
begin
  assert (select landmark from rescue_cases where id = v_case) is not null,
    'the case starts with a landmark';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform redact_case_sensitive_info(v_case, 'abuse case involving an identifiable person');
  reset role;

  assert (select landmark from rescue_cases where id = v_case) is null,
    'the landmark is cleared';
  assert (select exact_location_visibility from rescue_cases where id = v_case) = 'restricted',
    'exact location visibility is restricted';
  assert exists (
    select 1 from audit_logs
    where action = 'redact_case_sensitive_info' and target_type = 'case' and target_id = v_case
  ), 'redaction is audited in audit_logs';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  begin
    perform redact_case_sensitive_info(v_case, 'trying again');
    assert false, 'a non-moderator must not be able to redact a case';
  exception when others then
    assert sqlerrm like '%requires_moderator%', 'unexpected error: ' || sqlerrm;
  end;
  reset role;
end $$;

-- 5. Account restrictions: suspending sets is_suspended, lifting
-- clears it only once no other active suspend/ban remains.
do $$
declare
  v_user uuid := pg_temp.mk_user('restricted_user');
  v_r1 uuid; v_r2 uuid;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  v_r1 := issue_account_restriction(v_user, 'suspended', 'repeated spam reports');
  v_r2 := issue_account_restriction(v_user, 'banned', 'escalated after a second incident');
  reset role;

  assert (select is_suspended from profiles where id = v_user),
    'the account is suspended after issuing a suspension';
  assert exists (
    select 1 from moderation_actions where action_type = 'suspend_account' and target_id = v_user
  ), 'suspending is audited';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform lift_account_restriction(v_r1, 'appeal upheld in part');
  reset role;
  assert (select is_suspended from profiles where id = v_user),
    'is_suspended stays true while the ban (a second active restriction) remains';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  perform lift_account_restriction(v_r2, 'appeal fully upheld');
  reset role;
  assert not (select is_suspended from profiles where id = v_user),
    'is_suspended clears once every suspend/ban restriction is lifted';

  perform set_config('request.jwt.claim.sub', pg_temp.uid('bystander')::text, true);
  set local role authenticated;
  begin
    perform issue_account_restriction(v_user, 'warning', 'trying again');
    assert false, 'a non-moderator must not be able to issue a restriction';
  exception when others then
    assert sqlerrm like '%requires_moderator%', 'unexpected error: ' || sqlerrm;
  end;
  reset role;
end $$;

-- 6. Appeals: only the restricted user may appeal their own
-- restriction, only a moderator may review, and review fields are
-- enforced by the guard trigger.
do $$
declare
  v_user uuid := pg_temp.mk_user('appellant');
  v_other uuid := pg_temp.mk_user('not_the_appellant');
  v_restriction uuid;
  v_appeal uuid;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.uid('mod')::text, true);
  set local role authenticated;
  v_restriction := issue_account_restriction(v_user, 'restricted', 'test restriction');
  reset role;

  perform set_config('request.jwt.claim.sub', v_other::text, true);
  set local role authenticated;
  begin
    insert into moderation_appeals (restriction_id, appellant_id, statement)
      values (v_restriction, v_other, 'this was not me');
    assert false, 'a user must not appeal someone else''s restriction';
  exception when others then
    assert sqlerrm like '%does not belong to the caller%', 'unexpected error: ' || sqlerrm;
  end;
  reset role;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  set local role authenticated;
  insert into moderation_appeals (restriction_id, appellant_id, statement)
    values (v_restriction, v_user, 'I was reporting cruelty, not committing it')
    returning id into v_appeal;
  update moderation_appeals set status = 'overturned', reviewed_by = v_user, reviewed_at = now()
    where id = v_appeal;
  assert (select status from moderation_appeals where id = v_appeal) = 'pending',
    'the appellant must not be able to review their own appeal (RLS blocks it before the guard trigger even runs)';
  reset role;

  declare v_mod_id uuid := pg_temp.uid('mod');
  begin
    perform set_config('request.jwt.claim.sub', v_mod_id::text, true);
    set local role authenticated;
    update moderation_appeals
    set status = 'overturned', reviewed_by = v_mod_id, reviewed_at = now(), decision_reason = 'context checked out'
    where id = v_appeal;
    reset role;
  end;

  assert (select status from moderation_appeals where id = v_appeal) = 'overturned',
    'the review took effect';
end $$;
