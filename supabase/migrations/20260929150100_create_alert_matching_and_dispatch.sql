-- Part 11: geospatial matching, radius escalation, delivery queue, and
-- device registration. Everything except register_device and
-- unregister_device is service-role only: the dispatch-alerts Edge
-- Function is the only caller.
--
-- Notification failure isolation: nothing here is called from
-- create_case or any client write path. A scheduled Edge Function
-- pulls work from these functions, so a failure here can never roll
-- back a case that was created successfully.

-- Dhaka has no daylight saving, so quiet hours are plain wall-clock
-- times in Asia/Dhaka. A start later than the end wraps midnight.
create or replace function is_in_quiet_hours(
  p_start time,
  p_end time,
  p_at timestamptz default now()
)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when p_start is null or p_end is null or p_start = p_end then false
    when p_start < p_end then
      (p_at at time zone 'Asia/Dhaka')::time >= p_start
      and (p_at at time zone 'Asia/Dhaka')::time < p_end
    else
      (p_at at time zone 'Asia/Dhaka')::time >= p_start
      or (p_at at time zone 'Asia/Dhaka')::time < p_end
  end;
$$;

-- ALERT-007: alerts run only while the case is live and still needs
-- help. "Adequate assistance" = at least one committed responder and no
-- unfulfilled need on the needs board (an empty board counts as met).
create or replace function case_needs_alerts(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    c.status in ('open', 'response_committed')
    and c.urgency in ('critical', 'urgent')
    and not (
      exists (
        select 1 from case_responses r
        where r.case_id = c.id and r.status in ('committed', 'confirmed')
      )
      and not exists (
        select 1 from case_needs n
        where n.case_id = c.id and not n.is_fulfilled
      )
    ),
    false
  )
  from rescue_cases c
  where c.id = p_case_id;
$$;

-- ALERT-003: candidate selection runs entirely in PostGIS against the
-- GiST index on base_location. The distance used for both the radius
-- test and the value shown to the volunteer is measured to the
-- server-derived approximate point, so nothing derived from the exact
-- coordinate ever reaches a notification.
create or replace function find_alert_candidates(
  p_case_id uuid,
  p_radius_km numeric
)
returns table (user_id uuid, distance_km numeric)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    np.user_id,
    round((st_distance(np.base_location, c.approximate_location) / 1000)::numeric, 1)
  from rescue_cases c
  join notification_preferences np
    on st_dwithin(np.base_location, c.approximate_location, p_radius_km * 1000)
  join profiles p on p.id = np.user_id
  left join user_availability ua on ua.user_id = np.user_id
  where c.id = p_case_id
    and c.approximate_location is not null
    and st_distance(np.base_location, c.approximate_location) <= np.alert_radius_km * 1000
    and np.user_id <> c.creator_id
    and not p.is_suspended
    and coalesce(ua.is_available, true)
    -- enum order is critical < urgent < support_needed < adoption_community
    and c.urgency <= np.min_urgency
    and exists (
      select 1 from volunteer_capabilities vc
      where vc.user_id = np.user_id
        and incident_type_matches_capability(c.incident_type, vc.capability)
    )
    -- no preferred animal types set means every animal type
    and (
      c.animal_type_id is null
      or not exists (
        select 1 from user_preferred_animal_types pt where pt.user_id = np.user_id
      )
      or exists (
        select 1 from user_preferred_animal_types pt
        where pt.user_id = np.user_id and pt.animal_type_id = c.animal_type_id
      )
    )
    and not exists (
      select 1 from account_restrictions ar
      where ar.user_id = np.user_id
        and ar.lifted_at is null
        and ar.restriction_type in ('restricted', 'suspended', 'banned')
    )
    -- existing commitment to this case
    and not exists (
      select 1 from case_responses r
      where r.case_id = c.id
        and r.responder_id = np.user_id
        and r.status in ('committed', 'confirmed', 'completed')
    )
    -- ALERT-006: already alerted about this case
    and not exists (
      select 1 from notifications n
      where n.recipient_id = np.user_id
        and n.case_id = c.id
        and n.category in (
          'new_critical_case_nearby', 'new_urgent_case_nearby', 'radius_expanded_case'
        )
    );
$$;

comment on function find_alert_candidates is
  'ALERT-003. Quiet hours are applied later, at delivery time, so a candidate inside quiet hours is recorded once and pushed when quiet hours end.';

-- One escalation pass for one case. Safe to run repeatedly: the unique
-- index on notifications makes a second run insert nothing.
create or replace function dispatch_case_alerts(p_case_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_case rescue_cases%rowtype;
  v_step alert_escalation_steps%rowtype;
  v_opened_at timestamptz;
  v_inserted integer;
begin
  select * into v_case from rescue_cases where id = p_case_id;
  if not found or not case_needs_alerts(p_case_id) then
    return 0;
  end if;

  select coalesce(min(created_at) filter (where new_status = 'open'), v_case.reported_at)
    into v_opened_at
    from case_status_history
    where case_id = p_case_id;

  select * into v_step
    from alert_escalation_steps
    where urgency = v_case.urgency
      and after_minutes <= extract(epoch from (now() - v_opened_at)) / 60
    order by step desc
    limit 1;
  if not found then
    return 0;
  end if;

  insert into notifications (recipient_id, case_id, category, step, payload)
  select
    cand.user_id,
    v_case.id,
    case
      when v_step.step > 1 then 'radius_expanded_case'
      when v_case.urgency = 'critical' then 'new_critical_case_nearby'
      else 'new_urgent_case_nearby'
    end::notification_category,
    v_step.step,
    jsonb_build_object(
      'incident_type', v_case.incident_type,
      'urgency', v_case.urgency,
      'area', coalesce(v_case.upazila_or_thana, v_case.district, v_case.division),
      'distance_km', cand.distance_km
    )
  from find_alert_candidates(v_case.id, v_step.radius_km) cand
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function dispatch_all_case_alerts()
returns integer
language sql
security definer
set search_path = public, extensions
as $$
  select coalesce(sum(dispatch_case_alerts(id)), 0)::integer
  from rescue_cases
  where status in ('open', 'response_committed')
    and urgency in ('critical', 'urgent');
$$;

-- Turns notifications into per-device push work. Quiet hours defer the
-- push (the inbox row still exists); only a user who enabled the
-- critical override receives a critical nearby alert inside quiet hours.
-- Nearby alerts stop once the case no longer needs help, and nothing
-- older than a day is pushed.
create or replace function queue_notification_deliveries()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queued integer;
begin
  insert into notification_deliveries (notification_id, device_id)
  select n.id, d.id
  from notifications n
  join user_devices d
    on d.user_id = n.recipient_id and d.is_active and d.platform in ('android', 'ios')
  join profiles p on p.id = n.recipient_id and not p.is_suspended
  left join notification_preferences np on np.user_id = n.recipient_id
  left join rescue_cases c on c.id = n.case_id
  where n.created_at > now() - interval '24 hours'
    and n.read_at is null
    and (
      n.category not in (
        'new_critical_case_nearby', 'new_urgent_case_nearby', 'radius_expanded_case'
      )
      or case_needs_alerts(n.case_id)
    )
    and (
      np.user_id is null
      or not is_in_quiet_hours(np.quiet_hours_start, np.quiet_hours_end)
      or (
        np.critical_override
        and c.urgency = 'critical'
        and n.category in ('new_critical_case_nearby', 'radius_expanded_case')
      )
    )
  on conflict (notification_id, device_id) do nothing;

  get diagnostics v_queued = row_count;
  return v_queued;
end;
$$;

-- Hands a batch of pending work to one dispatcher run. skip locked plus
-- the status flip keeps overlapping runs from sending the same push; a
-- run that dies mid-send is retried after five minutes.
create or replace function claim_pending_deliveries(p_limit integer default 100)
returns table (
  delivery_id uuid,
  expo_push_token text,
  language app_language,
  category notification_category,
  case_id uuid,
  payload jsonb
)
language sql
security definer
set search_path = public
as $$
  with picked as (
    select d.id
    from notification_deliveries d
    where d.status = 'pending'
       or (d.status = 'sending' and d.attempted_at < now() - interval '5 minutes')
    order by d.created_at
    limit p_limit
    for update skip locked
  ),
  claimed as (
    update notification_deliveries d
    set status = 'sending', attempted_at = now(), attempts = d.attempts + 1
    from picked
    where d.id = picked.id
    returning d.id, d.notification_id, d.device_id
  )
  select cl.id, dev.expo_push_token, pr.preferred_language, n.category, n.case_id, n.payload
  from claimed cl
  join notifications n on n.id = cl.notification_id
  join user_devices dev on dev.id = cl.device_id
  join profiles pr on pr.id = n.recipient_id;
$$;

-- p_results: [{delivery_id, ticket_id?, error?}]. DeviceNotRegistered
-- retires the token (ALERT-010: marked inactive, not deleted, to keep
-- delivery history). Any other error is retried up to three attempts.
create or replace function record_delivery_results(p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notification_deliveries d
  set
    expo_ticket_id = r.ticket_id,
    error_code = r.error,
    status = case
      when r.ticket_id is not null then 'accepted'
      when r.error = 'DeviceNotRegistered' then 'token_invalid'
      when d.attempts < 3 then 'pending'
      else 'failed'
    end
  from jsonb_to_recordset(p_results) as r(delivery_id uuid, ticket_id text, error text)
  where d.id = r.delivery_id;

  update user_devices dev
  set is_active = false
  from notification_deliveries d
  where d.device_id = dev.id and d.status = 'token_invalid' and dev.is_active;
end;
$$;

-- Push receipts are where Expo reports tokens that went bad after the
-- send was accepted. Checked once, between five minutes and a day after
-- the send (Expo keeps receipts for a day).
create or replace function claim_receipt_checks(p_limit integer default 300)
returns table (delivery_id uuid, expo_ticket_id text)
language sql
security definer
set search_path = public
as $$
  select d.id, d.expo_ticket_id
  from notification_deliveries d
  where d.status = 'accepted'
    and d.receipt_checked_at is null
    and d.attempted_at < now() - interval '5 minutes'
    and d.attempted_at > now() - interval '24 hours'
  order by d.attempted_at
  limit p_limit;
$$;

-- p_results: [{delivery_id, ok, error?}]
create or replace function record_receipt_results(p_results jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notification_deliveries d
  set
    receipt_checked_at = now(),
    error_code = r.error,
    status = case
      when r.ok then d.status
      when r.error = 'DeviceNotRegistered' then 'token_invalid'
      else 'failed'
    end
  from jsonb_to_recordset(p_results) as r(delivery_id uuid, ok boolean, error text)
  where d.id = r.delivery_id;

  update user_devices dev
  set is_active = false
  from notification_deliveries d
  where d.device_id = dev.id and d.status = 'token_invalid' and dev.is_active;
end;
$$;

-- Device tokens. Registration is an RPC (not a direct insert) so a
-- token that moves to a different account after sign-out and sign-in
-- is retired from the previous owner instead of colliding with the
-- unique active-token index.
create or replace function register_device(p_expo_push_token text, p_platform text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_expo_push_token !~ '^(Expo|Exponent)PushToken\[.+\]$' then
    raise exception 'invalid push token' using errcode = '22023';
  end if;

  update user_devices
  set is_active = false
  where expo_push_token = p_expo_push_token
    and is_active
    and user_id <> auth.uid();

  insert into user_devices (user_id, expo_push_token, platform)
  values (auth.uid(), p_expo_push_token, p_platform)
  on conflict (expo_push_token) where is_active
  do update set last_seen_at = now(), platform = excluded.platform
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function unregister_device(p_expo_push_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update user_devices
  set is_active = false
  where expo_push_token = p_expo_push_token and user_id = auth.uid();
$$;

-- Grants: the project's default privileges hand EXECUTE on new functions
-- to anon and authenticated by name, so revoke from those roles
-- explicitly (revoking from PUBLIC alone is a no-op for them).
revoke execute on function
  is_in_quiet_hours(time, time, timestamptz),
  case_needs_alerts(uuid),
  find_alert_candidates(uuid, numeric),
  dispatch_case_alerts(uuid),
  dispatch_all_case_alerts(),
  queue_notification_deliveries(),
  claim_pending_deliveries(integer),
  record_delivery_results(jsonb),
  claim_receipt_checks(integer),
  record_receipt_results(jsonb)
from public, anon, authenticated;

grant execute on function
  is_in_quiet_hours(time, time, timestamptz),
  case_needs_alerts(uuid),
  find_alert_candidates(uuid, numeric),
  dispatch_case_alerts(uuid),
  dispatch_all_case_alerts(),
  queue_notification_deliveries(),
  claim_pending_deliveries(integer),
  record_delivery_results(jsonb),
  claim_receipt_checks(integer),
  record_receipt_results(jsonb)
to service_role;

revoke execute on function
  register_device(text, text),
  unregister_device(text)
from public, anon;

grant execute on function
  register_device(text, text),
  unregister_device(text)
to authenticated;
