-- Part 19: case-creation idempotency, and an exhaustive sweep of
-- every (from_status, to_status) pair in case_status - not just the
-- edges case_status_transitions lists, but every illegal pair too,
-- confirming transition_case_status() enforces the table exactly and
-- respects requires_moderator. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('creator');
select pg_temp.mk_user('moderator_actor');
\o
update profiles set role = 'moderator' where id = pg_temp.uid('moderator_actor');

-- 1. Idempotency: submitting the same idempotency key twice returns
-- the same case, never a second row.
do $$
declare
  v_key text := gen_random_uuid()::text;
  v_creator uuid := pg_temp.uid('creator');
  v_point geography := pg_temp.case_point();
  v_first rescue_cases;
  v_second rescue_cases;
begin
  perform set_config('request.jwt.claim.sub', v_creator::text, true);
  set local role authenticated;
  v_first := create_case(v_key, 'injured_animal', 'urgent', null, 'first attempt', v_point, 'landmark', 'Dhaka', 'Dhaka', 'Dhanmondi', true);
  v_second := create_case(v_key, 'injured_animal', 'urgent', null, 'retried attempt', v_point, 'landmark', 'Dhaka', 'Dhaka', 'Dhanmondi', true);
  reset role;

  assert v_first.id = v_second.id, 'a retried submission returns the same case, not a new one';
  assert (select count(*) from rescue_cases where idempotency_key = v_key) = 1,
    'exactly one case exists for this idempotency key, however many times it was submitted';
  -- The second call's differing description must never overwrite the
  -- first: create_case() only ever inserts once, then returns the
  -- existing row unchanged.
  assert v_first.description = 'first attempt', 'a retried submission does not silently alter the original case';
end $$;

-- 2. Exhaustive status-transition sweep: every (from, to) pair in
-- case_status, not a hand-picked sample. One real case is reused and
-- reset to each starting status directly (bypassing the normal
-- guard, the same way Part 16's public-sharing tests set up a
-- non-reachable status for testing) rather than creating 380 cases.
do $$
declare
  v_from case_status;
  v_to case_status;
  v_case_id uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_creator uuid := pg_temp.uid('creator');
  v_moderator uuid := pg_temp.uid('moderator_actor');
  v_edge case_status_transitions;
  v_checked integer := 0;
begin
  for v_from in select unnest(enum_range(null::case_status)) loop
    for v_to in select unnest(enum_range(null::case_status)) loop
      continue when v_from = v_to;
      v_checked := v_checked + 1;

      select * into v_edge from case_status_transitions
        where from_status = v_from and to_status = v_to;

      -- No edge at all: illegal for anyone, moderator included.
      if not found then
        perform set_config('rescue_alert.allow_status_change', 'true', true);
        update rescue_cases set status = v_from where id = v_case_id;
        begin
          call pg_temp.as_user(v_moderator, format(
            'select transition_case_status(%L::uuid, %L::case_status, %L::uuid, %L)',
            v_case_id, v_to, v_moderator, 'sweep'
          ));
          assert false, format('%s -> %s has no table edge but succeeded', v_from, v_to);
        exception when others then
          reset role;
          assert sqlerrm like 'illegal_status_transition:%',
            format('%s -> %s: expected illegal_status_transition, got: %s', v_from, v_to, sqlerrm);
        end;
        continue;
      end if;

      -- An edge exists. A moderator may always use it.
      perform set_config('rescue_alert.allow_status_change', 'true', true);
      update rescue_cases set status = v_from where id = v_case_id;
      call pg_temp.as_user(v_moderator, format(
        'select transition_case_status(%L::uuid, %L::case_status, %L::uuid, %L)',
        v_case_id, v_to, v_moderator, 'sweep'
      ));
      assert (select status from rescue_cases where id = v_case_id) = v_to,
        format('%s -> %s: moderator transition did not take effect', v_from, v_to);

      if v_edge.requires_moderator then
        -- A plain actor must be rejected on a moderator-only edge.
        perform set_config('rescue_alert.allow_status_change', 'true', true);
        update rescue_cases set status = v_from where id = v_case_id;
        begin
          call pg_temp.as_user(v_creator, format(
            'select transition_case_status(%L::uuid, %L::case_status, %L::uuid, %L)',
            v_case_id, v_to, v_creator, 'sweep'
          ));
          assert false, format('%s -> %s requires a moderator but a plain actor succeeded', v_from, v_to);
        exception when others then
          reset role;
          assert sqlerrm like 'requires_moderator:%',
            format('%s -> %s: expected requires_moderator, got: %s', v_from, v_to, sqlerrm);
        end;
      else
        -- Not moderator-gated: a plain actor may use it too.
        perform set_config('rescue_alert.allow_status_change', 'true', true);
        update rescue_cases set status = v_from where id = v_case_id;
        call pg_temp.as_user(v_creator, format(
          'select transition_case_status(%L::uuid, %L::case_status, %L::uuid, %L)',
          v_case_id, v_to, v_creator, 'sweep'
        ));
        assert (select status from rescue_cases where id = v_case_id) = v_to,
          format('%s -> %s: plain-actor transition did not take effect', v_from, v_to);
      end if;
    end loop;
  end loop;

  raise notice 'status-transition sweep checked % (from, to) pairs', v_checked;
end $$;
