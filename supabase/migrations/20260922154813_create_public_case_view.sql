
-- Public share page data (PRD section 25). Owned by the migration
-- role, which owns rescue_cases and therefore bypasses its RLS when
-- this view queries it - the WHERE clause and column list below are
-- the only filter anon ever sees. No exact location, no creator
-- identity, no phone numbers, no private fields.
create view rescue_cases_public as
select
  c.id,
  c.public_reference,
  c.incident_type,
  a.slug as animal_type,
  c.urgency,
  c.status,
  c.title,
  c.division,
  c.district,
  c.upazila_or_thana,
  c.approximate_location,
  c.reported_at,
  c.updated_at,
  (
    select body from case_updates u
    where u.case_id = c.id
    order by u.created_at desc
    limit 1
  ) as last_official_update
from rescue_cases c
left join animal_types a on a.id = c.animal_type_id
where c.status not in (
  'draft', 'submitted', 'under_review', 'duplicate', 'false_report',
  'spam', 'unsafe_or_prohibited_content', 'cancelled_by_reporter'
)
and c.exact_location_visibility = 'standard';

comment on view rescue_cases_public is 'CASE-005/MAP-005/FEED-005: anon-safe subset for public share pages. Excludes exact location, creator identity, and restricted-sensitivity cases entirely.';

grant select on rescue_cases_public to anon, authenticated;
