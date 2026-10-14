-- Part 16: a public share page needs to generate a signed URL for its
-- approved media - the bucket stays private (public: false), but a
-- narrowly-scoped anon SELECT policy lets createSignedUrl succeed for
-- exactly the media get_public_case_detail() already exposes (not
-- hidden, not graphic, case publicly visible). The signed URL itself
-- is what a crawler/og:image fetch actually uses - anon never reads
-- the file directly without going through a signing call this policy
-- gates.
--
-- Wrapped in a SECURITY DEFINER helper rather than joining rescue_cases
-- directly in the policy: an RLS qual runs as the querying role (anon
-- here), which has no SELECT grant on rescue_cases/rescue_media at all
-- outside this helper - the same reason every other cross-table RLS
-- check in this project goes through a security-definer function.
create or replace function is_media_publicly_visible(p_storage_path text) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from rescue_media m
    join rescue_cases c on c.id = m.case_id
    where m.storage_path = p_storage_path
      and not m.is_hidden
      and not m.is_graphic
      and c.exact_location_visibility = 'standard'
      and c.status not in (
        'draft', 'submitted', 'under_review', 'duplicate', 'false_report',
        'spam', 'unsafe_or_prohibited_content', 'cancelled_by_reporter'
      )
  );
$$;

create policy rescue_media_objects_select_public on storage.objects
  for select to anon
  using (bucket_id = 'rescue-media' and is_media_publicly_visible(name));
