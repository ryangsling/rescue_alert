
-- REVOKE ... FROM PUBLIC only strips the PUBLIC pseudo-role's own
-- grant - it does not touch a privilege granted directly to a named
-- role like anon. This project's default-privileges rule grants
-- EXECUTE on every new public-schema function directly to anon,
-- authenticated, and service_role by name, so every earlier
-- "revoke ... from public" in this migration set was a no-op for
-- anon specifically. Proven via pg_proc.proacl, not assumed.
revoke execute on function get_case_exact_location(uuid) from anon;
revoke execute on function get_case_location_history(uuid) from anon;
