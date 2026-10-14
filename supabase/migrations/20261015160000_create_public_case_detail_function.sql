-- Part 16, PRD section 25: the public share page's exactly seven
-- elements - case/animal type, approximate area, current status,
-- approved media, required assistance, last official update, and the
-- sign-in/app-open link (a client-side concern, not data). Mirrors
-- rescue_cases_public's own visibility WHERE clause rather than
-- calling is_case_visible(), which assumes auth.uid() - anon has none.
--
-- "Approved" media = passed the automatic safety gates already in
-- place (not hidden, not graphic) - this project has no separate
-- manual per-item approval queue for public exposure, and PRD 25 does
-- not ask for one.
create or replace function get_public_case_detail(p_public_reference text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id,
    'public_reference', c.public_reference,
    'incident_type', c.incident_type,
    'animal_type', a.slug,
    'urgency', c.urgency,
    'status', c.status,
    'title', c.title,
    'division', c.division,
    'district', c.district,
    'upazila_or_thana', c.upazila_or_thana,
    'reported_at', c.reported_at,
    'updated_at', c.updated_at,
    'last_official_update', (
      select body from case_updates u
      where u.case_id = c.id
      order by u.created_at desc
      limit 1
    ),
    'needs', coalesce((
      select jsonb_agg(jsonb_build_object('need_type', n.need_type, 'is_fulfilled', n.is_fulfilled) order by n.need_type)
      from case_needs n
      where n.case_id = c.id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'storage_path', m.storage_path) order by m.created_at)
      from rescue_media m
      where m.case_id = c.id and not m.is_hidden and not m.is_graphic
    ), '[]'::jsonb)
  )
  from rescue_cases c
  left join animal_types a on a.id = c.animal_type_id
  where c.public_reference = p_public_reference
    and c.status not in (
      'draft', 'submitted', 'under_review', 'duplicate', 'false_report',
      'spam', 'unsafe_or_prohibited_content', 'cancelled_by_reporter'
    )
    and c.exact_location_visibility = 'standard';
$$;

revoke all on function get_public_case_detail(text) from public;
grant execute on function get_public_case_detail(text) to anon, authenticated;
