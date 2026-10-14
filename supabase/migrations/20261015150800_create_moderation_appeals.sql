-- MOD-008: appeals, recorded and reviewable. "By a different
-- authorized moderator where possible" is a soft PRD requirement, not
-- enforced in SQL - a pilot may have only one or two moderators, and a
-- hard block would make an appeal unreviewable. The dashboard instead
-- shows each moderator which appeals they themselves issued the
-- underlying restriction for, so routing to someone else is a UI
-- nudge, not a database rule.
create table moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  restriction_id uuid not null unique references account_restrictions(id),
  appellant_id uuid not null references profiles(id),
  statement text not null,
  status text not null default 'pending' check (status in ('pending', 'upheld', 'overturned')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now()
);

comment on table moderation_appeals is 'MOD-008. One appeal per restriction (unique restriction_id) - a new complaint about the same restriction is a reply on the existing appeal, not a second row.';

create or replace function guard_moderation_appeal() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.appellant_id <> auth.uid() then
      raise exception 'appellant_id must be the caller';
    end if;
    if not exists (
      select 1 from account_restrictions
      where id = new.restriction_id and user_id = auth.uid()
    ) then
      raise exception 'restriction does not belong to the caller';
    end if;
    if new.status <> 'pending' or new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'a new appeal must start pending and unreviewed';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.restriction_id <> old.restriction_id
       or new.appellant_id <> old.appellant_id
       or new.statement <> old.statement
    then
      raise exception 'restriction_id, appellant_id, and statement are immutable';
    end if;
    if old.status <> 'pending' then
      raise exception 'only a pending appeal may be reviewed';
    end if;
    if not is_moderator_or_admin() then
      raise exception 'only a moderator or administrator may review an appeal';
    end if;
    if new.status = 'pending' or new.reviewed_by <> auth.uid() or new.reviewed_at is null then
      raise exception 'a review must set status to upheld/overturned, reviewed_by to the caller, and reviewed_at';
    end if;
  end if;
  return new;
end;
$$;

create trigger moderation_appeals_guard
  before insert or update on moderation_appeals
  for each row execute function guard_moderation_appeal();

alter table moderation_appeals enable row level security;

create policy moderation_appeals_select on moderation_appeals
  for select to authenticated using (appellant_id = auth.uid() or is_moderator_or_admin());
create policy moderation_appeals_insert on moderation_appeals
  for insert to authenticated with check (appellant_id = auth.uid());
create policy moderation_appeals_update on moderation_appeals
  for update to authenticated using (is_moderator_or_admin()) with check (is_moderator_or_admin());
