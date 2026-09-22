
create or replace function prevent_self_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.is_suspended is distinct from old.is_suspended)
     and not is_moderator_or_admin() then
    raise exception 'only a moderator or administrator may change role or is_suspended';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

alter table animal_types enable row level security;
alter table profiles enable row level security;
alter table user_private_details enable row level security;
alter table user_devices enable row level security;
alter table notification_preferences enable row level security;
alter table user_preferred_animal_types enable row level security;
alter table volunteer_capabilities enable row level security;
alter table user_availability enable row level security;

-- animal_types: public reference data.
create policy animal_types_select_active on animal_types
  for select using (is_active or is_moderator_or_admin());
create policy animal_types_admin_write on animal_types
  for all using (current_profile_role() = 'administrator')
  with check (current_profile_role() = 'administrator');

-- profiles: PROF-006 - community-visible, no sensitive personal data
-- lives on this table. Any signed-in user may read any profile;
-- only the owner (or a moderator/administrator) may write it, and
-- the trigger above blocks self-escalation of role/is_suspended.
create policy profiles_select_authenticated on profiles
  for select to authenticated using (true);
create policy profiles_insert_self on profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self_or_moderator on profiles
  for update to authenticated
  using (id = auth.uid() or is_moderator_or_admin())
  with check (id = auth.uid() or is_moderator_or_admin());

-- user_private_details: PRD 21.1 - owner and narrowly authorized
-- functions only. Deliberately no moderator override at this layer.
create policy user_private_details_owner_only on user_private_details
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_devices_owner_only on user_devices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notification_preferences_owner_only on notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_preferred_animal_types_owner_only on user_preferred_animal_types
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy volunteer_capabilities_owner_only on volunteer_capabilities
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_availability_owner_only on user_availability
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
