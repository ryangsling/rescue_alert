\i supabase/tests/helpers.sql

-- 1. transition_case_status() must reject an actor id that does not
-- match the real caller - a real impersonation bug found while
-- building this part (see the migration's own comment).
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_a');
  v_moderator uuid := pg_temp.mk_user('closure_moderator_a');
  v_case uuid;
  v_failed boolean := false;
begin
  update profiles set role = 'moderator' where id = v_moderator;
  v_case := pg_temp.mk_case(v_creator, 'support_needed');

  begin
    perform set_config('request.jwt.claim.sub', v_creator::text, true);
    set local role authenticated;
    -- v_creator impersonates v_moderator to try to force a
    -- moderator-only transition.
    perform transition_case_status(v_case, 'closed_by_moderator', v_moderator, 'spoofed');
    reset role;
  exception when others then
    v_failed := true;
    reset role;
  end;

  assert v_failed, 'transition_case_status must reject a p_actor_id that does not match auth.uid()';
end $$;

-- 2. close_case() requires both an outcome and a non-empty final
-- update (OUT-001, OUT-002).
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_b');
  v_case uuid := pg_temp.mk_case(pg_temp.uid('closure_creator_b'), 'support_needed');
  v_failed boolean := false;
begin
  begin
    call pg_temp.as_user(v_creator, format(
      $q$select close_case(%L, 'successfully_rescued', '')$q$, v_case
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'close_case must reject an empty final update';
end $$;

-- 3. A normal close_case() call succeeds, writes the final update,
-- the outcome row, and stops this case from ever matching
-- case_needs_alerts() again (OUT-003).
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_c');
  v_case uuid := pg_temp.mk_case(v_creator, 'support_needed');
  v_outcome_count int;
  v_update_count int;
begin
  call pg_temp.as_user(v_creator, format(
    $q$select close_case(%L, 'successfully_rescued', 'All done, animal is safe.')$q$, v_case
  ));

  select count(*) into v_outcome_count from rescue_outcomes where case_id = v_case;
  assert v_outcome_count = 1, 'close_case must insert exactly one rescue_outcomes row';

  select count(*) into v_update_count
  from case_updates where case_id = v_case and body = 'All done, animal is safe.';
  assert v_update_count = 1, 'close_case must post the final update as a case_updates row';

  assert (select status from rescue_cases where id = v_case) = 'closed',
    'close_case must transition the case to closed';

  assert not case_needs_alerts(v_case),
    'a closed case must never be matched by case_needs_alerts again';
end $$;

-- 4. Only the creator, coordinator, or a moderator may close a case -
-- an unrelated authenticated user may not.
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_d');
  v_stranger uuid := pg_temp.mk_user('closure_stranger_d');
  v_case uuid := pg_temp.mk_case(v_creator, 'support_needed');
  v_failed boolean := false;
begin
  begin
    call pg_temp.as_user(v_stranger, format(
      $q$select close_case(%L, 'successfully_rescued', 'Not my case to close.')$q$, v_case
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'an unrelated user must not be able to close a case';
end $$;

-- 5. Contribution crediting at closure: close_case can credit
-- selected responders for selected categories, already verified
-- since the closer is themselves an authorized confirmer (OUT-004,
-- PRD 13.2).
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_e');
  v_responder uuid := pg_temp.mk_user('closure_responder_e');
  v_case uuid := pg_temp.mk_case(v_creator, 'support_needed');
  v_contribution contributions;
begin
  perform pg_temp.mk_response(v_case, v_responder);

  call pg_temp.as_user(v_creator, format(
    $q$select close_case(%L, 'successfully_rescued', 'Thanks everyone.', p_contributions := %L::jsonb)$q$,
    v_case,
    jsonb_build_array(jsonb_build_object('user_id', v_responder, 'category', 'on_site_responder'))
  ));

  select * into v_contribution from contributions
  where case_id = v_case and user_id = v_responder and category = 'on_site_responder';

  assert v_contribution.id is not null, 'close_case must credit the named contribution';
  assert v_contribution.verified_by = v_creator,
    'a contribution credited at closure must already be verified by the closer';
  assert v_contribution.verified_at is not null,
    'a contribution credited at closure must already carry a verified_at timestamp';
end $$;

-- 6. A user cannot self-verify their own contribution - verified_by
-- must come from an authorized confirmer, never the subject
-- themselves (PRD 13.2 lists creator/coordinator/org/moderator/
-- multi-participant confirmation; self-confirmation is not among
-- them). Real gap found auditing the existing bare RLS policy, which
-- allowed a self-insert with no restriction on verified_by at all.
do $$
declare
  v_responder uuid := pg_temp.mk_user('closure_responder_f');
  v_case uuid := pg_temp.mk_case(pg_temp.mk_user('closure_creator_f'), 'support_needed');
  v_failed boolean := false;
begin
  begin
    call pg_temp.as_user(v_responder, format(
      $q$insert into contributions (user_id, case_id, category, verified_by, verified_at)
         values (%L, %L, 'on_site_responder', %L, now())$q$,
      v_responder, v_case, v_responder
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'a user must not be able to self-verify their own contribution';
end $$;

-- 7. Reopening: a moderator may reopen a closed case through
-- transition_case_status() directly (the 'closed' -> 'open' edge
-- already requires_moderator); a non-moderator may not. The audit
-- trail (case_status_history) is preserved either way.
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_g');
  v_moderator uuid := pg_temp.mk_user('closure_moderator_g');
  v_case uuid;
  v_failed boolean := false;
  v_history_count int;
begin
  update profiles set role = 'moderator' where id = v_moderator;
  v_case := pg_temp.mk_case(v_creator, 'support_needed');
  select count(*) into v_history_count from case_status_history where case_id = v_case;

  call pg_temp.as_user(v_creator, format(
    $q$select close_case(%L, 'successfully_rescued', 'Closing now.')$q$, v_case
  ));

  begin
    call pg_temp.as_user(v_creator, format(
      $q$select transition_case_status(%L, 'open', %L, 'I want it back')$q$, v_case, v_creator
    ));
  exception when others then
    v_failed := true;
  end;
  assert v_failed, 'a non-moderator must not be able to reopen a closed case';

  call pg_temp.as_user(v_moderator, format(
    $q$select transition_case_status(%L, 'open', %L, 'Closed in error')$q$, v_case, v_moderator
  ));
  assert (select status from rescue_cases where id = v_case) = 'open',
    'a moderator must be able to reopen a closed case';

  assert (
    select count(*) from case_status_history where case_id = v_case
  ) = v_history_count + 2, 'both the close and the reopen must be recorded in case_status_history';
end $$;

-- 8. get_user_rescue_history() shows only verified contributions and
-- no sensitive case detail (no exact location, no phone).
do $$
declare
  v_creator uuid := pg_temp.mk_user('closure_creator_h');
  v_responder uuid := pg_temp.mk_user('closure_responder_h');
  v_case uuid := pg_temp.mk_case(v_creator, 'support_needed');
  v_row record;
  v_unverified_count int;
begin
  perform pg_temp.mk_response(v_case, v_responder);

  -- An unverified self-claim must not appear.
  call pg_temp.as_user(v_responder, format(
    $q$insert into contributions (user_id, case_id, category) values (%L, %L, 'on_site_responder')$q$,
    v_responder, v_case
  ));
  select count(*) into v_unverified_count from get_user_rescue_history(v_responder);
  assert v_unverified_count = 0, 'an unverified contribution must not appear in rescue history';

  call pg_temp.as_user(v_creator, format(
    $q$select close_case(%L, 'successfully_rescued', 'Great work.', p_contributions := %L::jsonb)$q$,
    v_case,
    jsonb_build_array(jsonb_build_object('user_id', v_responder, 'category', 'on_site_responder'))
  ));

  select * into v_row from get_user_rescue_history(v_responder) limit 1;
  assert v_row.case_id = v_case, 'a verified contribution must appear in rescue history';
  assert v_row.public_reference is not null, 'rescue history must carry the public case reference, not the exact location';
end $$;
