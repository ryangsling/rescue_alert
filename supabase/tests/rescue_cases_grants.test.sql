-- Regression test for a real incident: a well-intentioned fix for
-- "authenticated/anon can't read rescue_cases at all" (Part 12, while
-- building the case detail screen) used a table-wide `grant select`,
-- which silently re-granted SELECT on `location` (the exact
-- coordinate) too - a plain GRANT adds a column-level ACL entry for
-- every column regardless of an earlier column-level REVOKE, the
-- mirror image of the column-level-REVOKE-vs-table-wide-GRANT gap
-- fix_exact_location_column_grants.sql's own comment already
-- documents. Caught only by testing in a real browser, not by this
-- harness's own default-grants-all setup.sql, which can't reproduce a
-- live-project-only grant restriction - hence this explicit check.
do $$
begin
  assert not has_column_privilege('authenticated', 'rescue_cases', 'location', 'select'),
    'authenticated must never read the exact coordinate directly - get_case_exact_location() is the only path';
  assert has_column_privilege('authenticated', 'rescue_cases', 'title', 'select'),
    'authenticated must be able to read ordinary case fields directly';
end $$;
