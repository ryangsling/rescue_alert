-- Part 14 (ORG-004): organizations have no base location in this
-- schema (unlike individual volunteers' notification_preferences.
-- base_location), so there is no radius concept to match against -
-- matching here is purely verification + availability + opted-in
-- urgency/incident type, pushed once when a case opens. This is a
-- disclosed, deliberately simpler model than the individual-volunteer
-- geospatial dispatcher (Part 11); it is not a stand-in for it.
create or replace function find_org_alert_candidates(p_case_id uuid)
returns table (user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct m.user_id
  from rescue_cases c
  join organizations o on o.verification_status = 'verified'
  join organization_availability a
    on a.organization_id = o.id
    and a.is_currently_available
    and c.urgency = any(a.opted_in_urgency_levels)
    and c.incident_type = any(a.opted_in_incident_types)
  join organization_members m on m.organization_id = o.id
  where c.id = p_case_id;
$$;

comment on function find_org_alert_candidates is 'ORG-004: a verified, currently-available organization receives this only if it explicitly opted into both this case''s urgency level and its incident type.';

create or replace function notify_organizations_on_case_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_recipient uuid;
begin
  begin
    if new.new_status <> 'open' then
      return new;
    end if;

    v_payload := notification_case_payload(new.case_id);

    for v_recipient in select user_id from find_org_alert_candidates(new.case_id) loop
      perform enqueue_notification(v_recipient, new.case_id, 'organization_alert', v_payload);
    end loop;
  exception when others then
    raise warning 'notify_organizations_on_case_open failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_organizations_on_case_open
  after insert on case_status_history
  for each row execute function notify_organizations_on_case_open();
