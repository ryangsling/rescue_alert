-- CASE-003/004/005. Private bucket (public: false) - access is only
-- ever through a signed URL, matching AGENTS.md's tech stack decision
-- ("Media | Supabase Storage with signed URLs"). Images only, per
-- PRD 7.2's "captures or selects at least one image" - video is not
-- part of this feature. Path convention: {case_id}/{media_id}.{ext},
-- so RLS can scope by the case a client is uploading into.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rescue-media', 'rescue-media', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Upload only into a case the caller created (Part 8's creation flow
-- uploads media right after create_case() succeeds, once the real
-- case id exists - see docs/PLAN.md Part 8 for why uploads are
-- deferred rather than happening against a not-yet-created case).
create policy rescue_media_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'rescue-media'
    and is_case_creator(((storage.foldername(name))[1])::uuid)
    and not current_profile_is_suspended()
  );

-- Read access follows the same visibility rule as the case itself -
-- signed URLs are generated client-side against this policy.
create policy rescue_media_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rescue-media'
    and is_case_visible(((storage.foldername(name))[1])::uuid)
  );

create policy rescue_media_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'rescue-media'
    and (is_case_creator(((storage.foldername(name))[1])::uuid) or is_moderator_or_admin())
  );
