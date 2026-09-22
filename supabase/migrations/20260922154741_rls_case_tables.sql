
-- Guard: status may only change via transition_case_status(), which
-- sets this transaction-local flag immediately before its own UPDATE.
-- A direct client UPDATE that touches status is rejected even if the
-- caller otherwise has UPDATE rights on the row.
create or replace function guard_status_column() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('rescue_alert.allow_status_change', true), '') <> 'true' then
    raise exception 'status may only be changed via transition_case_status()';
  end if;
  return new;
end;
$$;

create trigger rescue_cases_guard_status_column
  before update on rescue_cases
  for each row execute function guard_status_column();

create or replace function transition_case_status(
  p_case_id uuid,
  p_new_status case_status,
  p_actor_id uuid,
  p_reason text default null
) returns rescue_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case rescue_cases;
  v_actor profiles;
  v_edge case_status_transitions;
begin
  select * into v_case from rescue_cases where id = p_case_id for update;
  if not found then
    raise exception 'case_not_found: %', p_case_id;
  end if;

  select * into v_actor from profiles where id = p_actor_id;
  if not found then
    raise exception 'actor_not_found: %', p_actor_id;
  end if;
  if v_actor.is_suspended then
    raise exception 'actor_suspended: %', p_actor_id;
  end if;

  select * into v_edge
    from case_status_transitions
    where from_status = v_case.status and to_status = p_new_status;
  if not found then
    raise exception 'illegal_status_transition: % -> %', v_case.status, p_new_status;
  end if;

  if v_edge.requires_moderator and v_actor.role not in ('moderator', 'administrator') then
    raise exception 'requires_moderator: % -> % by role %', v_case.status, p_new_status, v_actor.role;
  end if;

  perform set_config('rescue_alert.allow_status_change', 'true', true);

  update rescue_cases
  set
    status = p_new_status,
    updated_at = now(),
    closed_at = case when p_new_status in ('closed', 'closed_by_moderator') then now() else closed_at end
  where id = p_case_id
  returning * into v_case;

  insert into case_status_history (case_id, actor_id, previous_status, new_status, reason)
  values (p_case_id, p_actor_id, v_edge.from_status, p_new_status, p_reason);

  return v_case;
end;
$$;

-- Case visibility rule, reused across every case-scoped table:
-- a case is broadly visible to authenticated users once past the
-- pre-publication/moderated-out states; before or in those states,
-- only participants and moderators may see it.
create or replace function is_case_visible(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rescue_cases c
    where c.id = p_case_id
      and (
        c.status not in ('draft', 'submitted', 'under_review', 'duplicate', 'false_report', 'spam', 'unsafe_or_prohibited_content')
        or is_case_participant(c.id)
      )
  );
$$;

alter table rescue_cases enable row level security;
alter table rescue_case_locations enable row level security;
alter table case_status_history enable row level security;
alter table case_responses enable row level security;
alter table case_needs enable row level security;
alter table case_updates enable row level security;
alter table case_comments enable row level security;
alter table comment_replies enable row level security;
alter table case_watchers enable row level security;
alter table rescue_media enable row level security;
alter table rescue_outcomes enable row level security;

-- rescue_cases: authenticated only at this layer - anon goes through
-- the public-safe view. Exact location column is part of the row, but
-- clients must not request it unless authorized; the confirmed policy
-- (accepted responders, coordinator, moderators) is documented here
-- and enforced by which columns the app layer requests, backed by
-- is_case_participant() for row visibility itself.
create policy rescue_cases_select on rescue_cases
  for select to authenticated using (is_case_visible(id));
create policy rescue_cases_insert on rescue_cases
  for insert to authenticated
  with check (creator_id = auth.uid() and not current_profile_is_suspended());
create policy rescue_cases_update on rescue_cases
  for update to authenticated
  using (is_case_creator(id) or is_case_coordinator(id) or is_moderator_or_admin())
  with check (is_case_creator(id) or is_case_coordinator(id) or is_moderator_or_admin());

create policy rescue_case_locations_select on rescue_case_locations
  for select to authenticated using (is_case_participant(case_id) or is_moderator_or_admin());
create policy rescue_case_locations_insert on rescue_case_locations
  for insert to authenticated with check (
    is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin()
  );

create policy case_status_history_select on case_status_history
  for select to authenticated using (is_case_visible(case_id));

create policy case_responses_select on case_responses
  for select to authenticated using (is_case_visible(case_id));
create policy case_responses_insert on case_responses
  for insert to authenticated
  with check (responder_id = auth.uid() and not current_profile_is_suspended());
create policy case_responses_update on case_responses
  for update to authenticated
  using (responder_id = auth.uid() or is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin())
  with check (responder_id = auth.uid() or is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin());

create policy case_needs_select on case_needs
  for select to authenticated using (is_case_visible(case_id));
create policy case_needs_write on case_needs
  for all to authenticated
  using (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin())
  with check (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin());

create policy case_updates_select on case_updates
  for select to authenticated using (is_case_visible(case_id));
create policy case_updates_insert on case_updates
  for insert to authenticated with check (
    author_id = auth.uid()
    and not current_profile_is_suspended()
    and (
      is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin()
      or exists (
        select 1 from rescue_cases c
        join organization_members m on m.organization_id = c.organization_id
        where c.id = case_id and m.user_id = auth.uid()
      )
    )
  );
create policy case_updates_update on case_updates
  for update to authenticated
  using (author_id = auth.uid() or is_moderator_or_admin())
  with check (author_id = auth.uid() or is_moderator_or_admin());

create policy case_comments_select on case_comments
  for select to authenticated using (is_case_visible(case_id));
create policy case_comments_insert on case_comments
  for insert to authenticated
  with check (author_id = auth.uid() and not current_profile_is_suspended());
create policy case_comments_update on case_comments
  for update to authenticated
  using (author_id = auth.uid() or is_moderator_or_admin())
  with check (author_id = auth.uid() or is_moderator_or_admin());

create policy comment_replies_select on comment_replies
  for select to authenticated using (
    exists (select 1 from case_comments c where c.id = comment_id and is_case_visible(c.case_id))
  );
create policy comment_replies_insert on comment_replies
  for insert to authenticated
  with check (author_id = auth.uid() and not current_profile_is_suspended());
create policy comment_replies_update on comment_replies
  for update to authenticated
  using (author_id = auth.uid() or is_moderator_or_admin())
  with check (author_id = auth.uid() or is_moderator_or_admin());

create policy case_watchers_owner_only on case_watchers
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy rescue_media_select on rescue_media
  for select to authenticated using (is_case_visible(case_id));
create policy rescue_media_insert on rescue_media
  for insert to authenticated
  with check (uploader_id = auth.uid() and not current_profile_is_suspended());
create policy rescue_media_update on rescue_media
  for update to authenticated
  using (is_moderator_or_admin())
  with check (is_moderator_or_admin());

create policy rescue_outcomes_select on rescue_outcomes
  for select to authenticated using (is_case_visible(case_id));
create policy rescue_outcomes_insert on rescue_outcomes
  for insert to authenticated with check (
    recorded_by = auth.uid()
    and not current_profile_is_suspended()
    and (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin())
  );
create policy rescue_outcomes_update on rescue_outcomes
  for update to authenticated
  using (is_moderator_or_admin())
  with check (is_moderator_or_admin());
