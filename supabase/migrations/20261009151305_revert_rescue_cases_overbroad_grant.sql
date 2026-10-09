-- Reverts the previous migration (fix_rescue_cases_missing_select_grant),
-- which was wrong: a table-wide `grant select` adds a column-level ACL
-- entry for every column regardless of an earlier column-level revoke,
-- so it silently restored SELECT on `location` (exact coordinates) to
-- authenticated and, for the first time ever, to anon - undoing
-- restrict_exact_location_column.sql and fix_exact_location_column_grants.sql's
-- deliberate protection. Root cause of the ORIGINAL 401/42501 the fix
-- was chasing: anon was never meant to read rescue_cases directly at
-- all ("anon only ever goes through rescue_cases_public()" - see
-- fix_exact_location_column_grants.sql's own comment); authenticated's
-- intended access is the explicit column list below, excluding location.
revoke all on rescue_cases from anon, authenticated;

grant select (
  id, creator_id, public_reference, incident_type, animal_type_id, urgency, status,
  title, description, approximate_location, division, district, upazila_or_thana,
  landmark, reported_at, last_seen_at, creator_on_site, exact_location_visibility,
  coordinator_id, organization_id, idempotency_key, created_at, updated_at,
  closed_at, closure_reason
) on rescue_cases to authenticated;
grant insert, update, delete on rescue_cases to authenticated;
