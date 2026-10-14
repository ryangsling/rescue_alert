-- Part 17 (PRD 12.1): hazard flags are stored and default to empty
-- when not supplied. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('reporter');
\o

do $$
declare
  v_reporter_id uuid := pg_temp.uid('reporter');
  v_case_point geography := pg_temp.case_point();
  v_case rescue_cases;
begin
  perform set_config('request.jwt.claim.sub', v_reporter_id::text, true);
  set local role authenticated;
  v_case := create_case(
    gen_random_uuid()::text, 'road_accident', 'critical', null, 'Dog hit on a busy road',
    v_case_point, 'near the flyover', 'Dhaka', 'Dhaka', 'Dhanmondi', true, null,
    array['traffic', 'electrical']::hazard_type[]
  );
  reset role;

  assert v_case.hazard_flags = array['traffic', 'electrical']::hazard_type[],
    'reported hazards are stored on the case';
end $$;

do $$
declare
  v_reporter_id uuid := pg_temp.uid('reporter');
  v_case_point geography := pg_temp.case_point();
  v_case rescue_cases;
begin
  perform set_config('request.jwt.claim.sub', v_reporter_id::text, true);
  set local role authenticated;
  v_case := create_case(
    gen_random_uuid()::text, 'injured_animal', 'urgent', null, 'Limping cat',
    v_case_point, 'near the market', 'Dhaka', 'Dhaka', 'Dhanmondi', true
  );
  reset role;

  assert v_case.hazard_flags = '{}'::hazard_type[],
    'hazard flags default to empty when not supplied';
end $$;
