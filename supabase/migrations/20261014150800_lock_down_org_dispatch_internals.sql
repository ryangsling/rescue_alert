-- Security-advisor cleanup, same pattern already applied to every
-- other trigger function in this project (Part 12's "two trigger
-- functions directly callable as RPCs" fix): a trigger function has
-- no business being callable directly via PostgREST, and
-- find_org_alert_candidates() returns a raw list of user ids (unlike
-- the already-accepted boolean/count helpers), which is a real
-- enumeration risk if left open to anon/authenticated.
revoke all on function notify_organizations_on_case_open() from public, anon, authenticated;
revoke all on function find_org_alert_candidates(uuid) from public, anon, authenticated;
