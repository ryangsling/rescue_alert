
alter table contributions enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table content_reports enable row level security;
alter table moderation_actions enable row level security;
alter table account_restrictions enable row level security;
alter table audit_logs enable row level security;

-- contributions: verified history is public per OUT-006; an
-- unverified claim is visible only to the claimant and whoever can
-- verify it.
create policy contributions_select on contributions
  for select to authenticated using (
    verified_by is not null
    or user_id = auth.uid()
    or is_case_creator(case_id)
    or is_case_coordinator(case_id)
    or is_moderator_or_admin()
  );
create policy contributions_insert on contributions
  for insert to authenticated with check (
    user_id = auth.uid() or is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin()
  );
create policy contributions_update on contributions
  for update to authenticated
  using (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin())
  with check (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin());

create policy achievements_select on achievements for select using (true);
create policy achievements_admin_write on achievements
  for all using (current_profile_role() = 'administrator')
  with check (current_profile_role() = 'administrator');

-- user_achievements are awarded by server-side logic (service role,
-- which bypasses RLS) - clients only ever read.
create policy user_achievements_select on user_achievements
  for select to authenticated using (true);

create policy content_reports_select on content_reports
  for select to authenticated using (reporter_id = auth.uid() or is_moderator_or_admin());
create policy content_reports_insert on content_reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and not current_profile_is_suspended());
create policy content_reports_update on content_reports
  for update to authenticated
  using (is_moderator_or_admin())
  with check (is_moderator_or_admin());

create policy moderation_actions_select on moderation_actions
  for select to authenticated using (is_moderator_or_admin());
create policy moderation_actions_insert on moderation_actions
  for insert to authenticated
  with check (moderator_id = auth.uid() and is_moderator_or_admin());

create policy account_restrictions_select on account_restrictions
  for select to authenticated using (user_id = auth.uid() or is_moderator_or_admin());
create policy account_restrictions_insert on account_restrictions
  for insert to authenticated
  with check (issued_by = auth.uid() and is_moderator_or_admin());
create policy account_restrictions_update on account_restrictions
  for update to authenticated
  using (is_moderator_or_admin())
  with check (is_moderator_or_admin());

create policy audit_logs_select on audit_logs
  for select to authenticated using (is_moderator_or_admin());
create policy audit_logs_insert on audit_logs
  for insert to authenticated
  with check (actor_id = auth.uid() and is_moderator_or_admin());
