-- Same gap as fix_anon_execute_revoke_wrong_role.sql already fixed
-- for get_case_exact_location/get_case_location_history: `revoke ...
-- from public` never touches a grant made directly to a named role,
-- and this project's default privileges grant EXECUTE on every new
-- function to anon by name. Caught by checking
-- has_function_privilege('anon', ...) directly, not assumed.
revoke execute on function get_responder_phone(uuid) from anon;
