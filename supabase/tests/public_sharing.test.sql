-- Part 16 tests: the public case detail/listing functions and the
-- anon storage read policy for approved media. Run via supabase/tests/run.sh.

\i supabase/tests/helpers.sql

\o /dev/null
select pg_temp.mk_user('creator');
select pg_temp.mk_user('other_creator');
\o

-- 1. get_public_case_detail exposes exactly the public-safe fields,
-- including needs and approved (not hidden, not graphic) media only.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_visible_media uuid;
  v_hidden_media uuid;
  v_graphic_media uuid;
  v_ref text;
  v_detail jsonb;
begin
  call pg_temp.as_user(pg_temp.uid('creator'), format(
    'insert into case_updates (case_id, author_id, body) values (%L, %L, %L)',
    v_case, pg_temp.uid('creator'), 'Official update for sharing'
  ));
  insert into case_needs (case_id, need_type) values (v_case, 'transport');

  call pg_temp.as_user(pg_temp.uid('creator'), format(
    'insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped) values (%L, %L, %L, true)',
    v_case, pg_temp.uid('creator'), 'visible.jpg'
  ));
  select id into v_visible_media from rescue_media where storage_path = 'visible.jpg';

  call pg_temp.as_user(pg_temp.uid('creator'), format(
    'insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped) values (%L, %L, %L, true)',
    v_case, pg_temp.uid('creator'), 'hidden.jpg'
  ));
  select id into v_hidden_media from rescue_media where storage_path = 'hidden.jpg';
  update rescue_media set is_hidden = true where id = v_hidden_media;

  call pg_temp.as_user(pg_temp.uid('creator'), format(
    'insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped, is_graphic) values (%L, %L, %L, true, true)',
    v_case, pg_temp.uid('creator'), 'graphic.jpg'
  ));
  select id into v_graphic_media from rescue_media where storage_path = 'graphic.jpg';
  select public_reference into v_ref from rescue_cases where id = v_case;

  set local role anon;
  select get_public_case_detail(v_ref) into v_detail;
  reset role;

  assert v_detail is not null, 'a live, standard-visibility case has a public detail payload';
  assert v_detail->>'last_official_update' = 'Official update for sharing',
    'the last official update is included';
  assert v_detail->'needs' @> '[{"need_type": "transport", "is_fulfilled": false}]'::jsonb,
    'required assistance is included';
  assert jsonb_array_length(v_detail->'media') = 1, 'only the one approved (not hidden, not graphic) media item is included';
  assert (v_detail->'media'->0->>'storage_path') = 'visible.jpg', 'the approved media is the visible one';
end $$;

-- 2. A pre-publication or sensitivity-restricted case has no public detail.
-- 'under_review' is used as the representative pre-publication status
-- rather than 'draft': create_case() always carries a case straight
-- through draft -> submitted -> open in one transaction, so a
-- standalone 'draft' row never actually persists in this app.
do $$
declare
  v_under_review_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_restricted_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  v_ref text;
begin
  perform set_config('rescue_alert.allow_status_change', 'true', true);
  update rescue_cases set status = 'under_review' where id = v_under_review_case;

  select public_reference into v_ref from rescue_cases where id = v_under_review_case;
  set local role anon;
  assert get_public_case_detail(v_ref) is null, 'a pre-publication case has no public detail';
  reset role;

  update rescue_cases set exact_location_visibility = 'restricted' where id = v_restricted_case;
  select public_reference into v_ref from rescue_cases where id = v_restricted_case;
  set local role anon;
  assert get_public_case_detail(v_ref) is null, 'a redacted/restricted case has no public detail';
  reset role;
end $$;

-- 3. list_public_open_cases includes live cases ordered critical-first
-- and excludes a closed one.
do $$
declare
  v_urgent uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_critical uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'critical');
  v_refs text[];
begin
  perform set_config('request.jwt.claim.sub', pg_temp.uid('creator')::text, true);
  set local role authenticated;
  perform close_case(v_urgent, 'successfully_rescued', 'All done', null, null, 'closing for the test');
  reset role;

  set local role anon;
  select array_agg(public_reference) into v_refs from list_public_open_cases(50, 0);
  reset role;

  assert (select public_reference from rescue_cases where id = v_critical) = any(v_refs),
    'a still-open critical case appears in the open listing';
  assert (select public_reference from rescue_cases where id = v_urgent) <> all(v_refs),
    'a closed case does not appear in the open listing';
end $$;

-- 4. list_public_rescue_history only includes cases with a recorded
-- outcome (close_case()), not every terminal status.
do $$
declare
  v_closed uuid := pg_temp.mk_case(pg_temp.uid('other_creator'), 'urgent');
  v_no_outcome uuid := pg_temp.mk_case(pg_temp.uid('other_creator'), 'urgent');
  v_refs text[];
begin
  perform set_config('request.jwt.claim.sub', pg_temp.uid('other_creator')::text, true);
  set local role authenticated;
  perform close_case(v_closed, 'adopted', 'Found a loving home', null, null, 'closing for the test');
  reset role;

  -- v_no_outcome stays open: no rescue_outcomes row, so it must not
  -- show up in "history" even though it is a live, visible case.
  set local role anon;
  select array_agg(public_reference) into v_refs from list_public_rescue_history(50, 0);
  reset role;

  assert (select public_reference from rescue_cases where id = v_closed) = any(v_refs),
    'a case with a recorded outcome appears in rescue history';
  assert (select public_reference from rescue_cases where id = v_no_outcome) <> all(v_refs),
    'a case with no recorded outcome does not appear in rescue history';
end $$;

-- 5. Approved media is readable by anon through storage.objects;
-- hidden/graphic media and media on a non-public case are not.
do $$
declare
  v_case uuid := pg_temp.mk_case(pg_temp.uid('creator'), 'urgent');
  v_other_case uuid := pg_temp.mk_case(pg_temp.uid('other_creator'), 'urgent');
begin
  insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped)
    values (v_case, pg_temp.uid('creator'), v_case::text || '/approved.jpg', true);
  insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped, is_hidden)
    values (v_case, pg_temp.uid('creator'), v_case::text || '/hidden.jpg', true, true);
  insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped, is_graphic)
    values (v_case, pg_temp.uid('creator'), v_case::text || '/graphic.jpg', true, true);

  update rescue_cases set exact_location_visibility = 'restricted' where id = v_other_case;
  insert into rescue_media (case_id, uploader_id, storage_path, exif_stripped)
    values (v_other_case, pg_temp.uid('other_creator'), v_other_case::text || '/restricted_case.jpg', true);

  insert into storage.objects (bucket_id, name) values
    ('rescue-media', v_case::text || '/approved.jpg'),
    ('rescue-media', v_case::text || '/hidden.jpg'),
    ('rescue-media', v_case::text || '/graphic.jpg'),
    ('rescue-media', v_other_case::text || '/restricted_case.jpg');

  set local role anon;
  assert exists (select 1 from storage.objects where name = v_case::text || '/approved.jpg'),
    'anon can read an approved media object for a public case';
  assert not exists (select 1 from storage.objects where name = v_case::text || '/hidden.jpg'),
    'anon cannot read a hidden media object';
  assert not exists (select 1 from storage.objects where name = v_case::text || '/graphic.jpg'),
    'anon cannot read a graphic media object';
  assert not exists (select 1 from storage.objects where name = v_other_case::text || '/restricted_case.jpg'),
    'anon cannot read media belonging to a location-restricted case';
  reset role;
end $$;

-- 6. Grants: anon-executable by design, matching this project's other
-- public-safe functions.
do $$
begin
  assert has_function_privilege('anon', 'get_public_case_detail(text)', 'execute'),
    'get_public_case_detail must be anon-executable';
  assert has_function_privilege('anon', 'list_public_open_cases(integer,integer)', 'execute'),
    'list_public_open_cases must be anon-executable';
  assert has_function_privilege('anon', 'list_public_rescue_history(integer,integer)', 'execute'),
    'list_public_rescue_history must be anon-executable';
end $$;
