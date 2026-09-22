
-- CREATE OR REPLACE FUNCTION resets EXECUTE back to PUBLIC by default
-- on each redefinition. Proven directly: anon could call
-- get_case_exact_location() after a later migration redefined it via
-- create or replace, despite an earlier explicit revoke. Re-asserting
-- the intended grants here, after every redefinition of these two
-- functions, as the final word.
revoke all on function get_case_exact_location(uuid) from public;
grant execute on function get_case_exact_location(uuid) to authenticated;

revoke all on function get_case_location_history(uuid) from public;
grant execute on function get_case_location_history(uuid) to authenticated;
