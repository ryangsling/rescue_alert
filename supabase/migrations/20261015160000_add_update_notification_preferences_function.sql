-- Mobile push-notification follow-up (Part 11 "Not done" item 4): no
-- client has ever set notification_preferences.base_location, so
-- find_alert_candidates has never actually matched a real volunteer -
-- the existing owner-only RLS policy already allows the write, but a
-- client cannot construct a `geography` literal through supabase-js,
-- so this function exists purely for that, the same reason create_case
-- takes p_location as `geography` already cast from EWKT text (Part 1).
create or replace function update_my_notification_preferences(
  p_base_location geography,
  p_alert_radius_km numeric
) returns void
language plpgsql
set search_path = public
as $$
begin
  if p_alert_radius_km <= 0 then
    raise exception 'alert radius must be positive';
  end if;

  insert into notification_preferences (user_id, base_location, alert_radius_km)
  values (auth.uid(), p_base_location, p_alert_radius_km)
  on conflict (user_id) do update
    set base_location = excluded.base_location,
        alert_radius_km = excluded.alert_radius_km,
        updated_at = now();
end;
$$;

revoke execute on function update_my_notification_preferences(geography, numeric) from public, anon;
grant execute on function update_my_notification_preferences(geography, numeric) to authenticated;
