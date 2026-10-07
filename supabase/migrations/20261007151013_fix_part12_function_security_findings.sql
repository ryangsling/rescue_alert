-- Pin search_path (the one piece create_response_coordination_rules
-- missed, caught by the security advisor) and close off the two new
-- trigger functions from direct RPC calls - they are meant to run
-- only as triggers, same as every notify_* function before them.
create or replace function extract_mentions(p_body text)
returns uuid[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array_agg(distinct m[1]::uuid), array[]::uuid[])
  from regexp_matches(p_body, '@\[[^\]]*\]\(([0-9a-fA-F-]{36})\)', 'g') as m
  where m[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$$;

revoke execute on function enforce_case_response_rules(), sync_case_needs_from_response()
from public, anon, authenticated;
