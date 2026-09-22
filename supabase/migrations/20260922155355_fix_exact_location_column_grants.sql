
-- The earlier column-level REVOKE had no effect: Supabase's default
-- template grants ALL PRIVILEGES ON ALL TABLES to anon/authenticated
-- as a table-wide grant (no column list), and a column-level REVOKE
-- only removes a matching column-level ACL entry - it cannot carve a
-- column out of a broader table-wide grant. Proven directly: a
-- bystander authenticated session could still `select location`
-- after the previous migration.
--
-- Correct fix: revoke the table-wide grant entirely, then re-grant
-- SELECT on an explicit column list that excludes `location`. anon
-- loses all direct access to both tables, matching the intent that
-- anon only ever goes through rescue_cases_public().

revoke all on rescue_cases from anon, authenticated;
revoke all on rescue_case_locations from anon, authenticated;

grant select (
  id, creator_id, public_reference, incident_type, animal_type_id, urgency, status,
  title, description, approximate_location, division, district, upazila_or_thana,
  landmark, reported_at, last_seen_at, creator_on_site, exact_location_visibility,
  coordinator_id, organization_id, idempotency_key, created_at, updated_at,
  closed_at, closure_reason
) on rescue_cases to authenticated;
grant insert, update, delete on rescue_cases to authenticated;

grant select (
  id, case_id, approximate_location, landmark, division, district, upazila_or_thana,
  changed_by, change_reason, created_at
) on rescue_case_locations to authenticated;
grant insert, update, delete on rescue_case_locations to authenticated;
