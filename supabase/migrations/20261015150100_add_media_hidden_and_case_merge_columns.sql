-- MOD-003 (hide media pending review) and MOD-004 (merge duplicates,
-- tracking which surviving case a merged-away case now points to).
alter table rescue_media add column is_hidden boolean not null default false;

drop policy rescue_media_select on rescue_media;
create policy rescue_media_select on rescue_media
  for select to authenticated using (
    is_case_visible(case_id) and (not is_hidden or uploader_id = auth.uid() or is_moderator_or_admin())
  );

alter table rescue_cases add column merged_into_case_id uuid references rescue_cases(id);
create index rescue_cases_merged_into_case_id_idx on rescue_cases (merged_into_case_id) where merged_into_case_id is not null;
