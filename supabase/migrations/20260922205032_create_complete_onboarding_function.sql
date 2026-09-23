-- PRD 7.1 steps 5-6. security invoker (default) and runs entirely
-- against auth.uid()'s own rows, so ordinary owner-only RLS policies
-- already established in Part 3 (rls_identity_tables.sql) apply as
-- normal - this function exists only to make the multi-table write
-- atomic (one round trip, no partial-onboarding state if a client
-- loses network mid-way), not to bypass any authorization check.
create or replace function complete_onboarding(
  p_capabilities volunteer_capability_type[],
  p_preferred_animal_type_ids uuid[],
  p_alert_radius_km numeric
) returns void
language plpgsql set search_path = public as $$
begin
  if p_alert_radius_km <= 0 then
    raise exception 'alert radius must be positive';
  end if;

  delete from volunteer_capabilities where user_id = auth.uid();
  if array_length(p_capabilities, 1) > 0 then
    insert into volunteer_capabilities (user_id, capability)
    select auth.uid(), unnest(p_capabilities);
  end if;

  delete from user_preferred_animal_types where user_id = auth.uid();
  if array_length(p_preferred_animal_type_ids, 1) > 0 then
    insert into user_preferred_animal_types (user_id, animal_type_id)
    select auth.uid(), unnest(p_preferred_animal_type_ids);
  end if;

  insert into notification_preferences (user_id, alert_radius_km)
  values (auth.uid(), p_alert_radius_km)
  on conflict (user_id) do update set alert_radius_km = excluded.alert_radius_km, updated_at = now();

  update profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = auth.uid();
end;
$$;

revoke execute on function complete_onboarding(volunteer_capability_type[], uuid[], numeric) from anon;
grant execute on function complete_onboarding(volunteer_capability_type[], uuid[], numeric) to authenticated;
