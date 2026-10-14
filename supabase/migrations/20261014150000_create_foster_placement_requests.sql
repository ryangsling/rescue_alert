-- Part 14 (PRD 5.4): "Keep exact addresses private until a placement
-- is approved." foster_profiles had no address column at all - adding
-- it here rather than working around its absence. A placement
-- request is the concrete mechanism that turns "until approved" into
-- something RLS and a function can actually check.
alter table foster_profiles add column address text;

comment on column foster_profiles.address is 'Never exposed directly - only through get_foster_address(), and only to the foster themselves, a moderator, or the creator/coordinator of a case with an approved placement request.';

create type placement_request_status as enum (
  'pending',
  'approved',
  'declined',
  'withdrawn'
);

create table foster_placement_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rescue_cases(id) on delete cascade,
  foster_profile_id uuid not null references foster_profiles(id) on delete cascade,
  requested_by uuid not null references profiles(id),
  status placement_request_status not null default 'pending',
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (case_id, foster_profile_id)
);

comment on table foster_placement_requests is 'PRD 5.4: a case creator/coordinator requests a specific foster; the foster (or a moderator) approves or declines. Approval is what unlocks get_foster_address() for that case.';

create index foster_placement_requests_case_idx on foster_placement_requests (case_id);
create index foster_placement_requests_foster_profile_idx on foster_placement_requests (foster_profile_id);
create index foster_placement_requests_requested_by_idx on foster_placement_requests (requested_by);
create index foster_placement_requests_decided_by_idx on foster_placement_requests (decided_by);

-- Layered RLS + trigger, the same pattern already used for
-- case_responses and contributions: RLS decides who may touch the
-- row at all, this trigger decides what they are allowed to change.
create or replace function guard_foster_placement_request() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.requested_by is distinct from auth.uid() then
      raise exception 'requested_by must be the requesting user themselves';
    end if;
    if new.status <> 'pending' then
      raise exception 'a new placement request must start pending';
    end if;
    return new;
  end if;

  -- tg_op = 'UPDATE'
  if new.case_id <> old.case_id or new.foster_profile_id <> old.foster_profile_id
     or new.requested_by <> old.requested_by then
    raise exception 'case_id, foster_profile_id, and requested_by are immutable';
  end if;

  if old.status <> 'pending' then
    raise exception 'a decided placement request cannot be changed again';
  end if;

  if new.status = 'withdrawn' then
    if new.requested_by is distinct from auth.uid() then
      raise exception 'only the requester may withdraw their own request';
    end if;
  elsif new.status in ('approved', 'declined') then
    if not (
      exists (select 1 from foster_profiles f where f.id = new.foster_profile_id and f.user_id = auth.uid())
      or is_moderator_or_admin()
    ) then
      raise exception 'only the foster or a moderator may approve or decline a placement request';
    end if;
    if new.decided_by is distinct from auth.uid() then
      raise exception 'decided_by must be the deciding user themselves';
    end if;
    if new.decided_at is null then
      raise exception 'decided_at is required when approving or declining';
    end if;
  else
    raise exception 'illegal status transition on a placement request';
  end if;

  return new;
end;
$$;

create trigger foster_placement_requests_guard
  before insert or update on foster_placement_requests
  for each row execute function guard_foster_placement_request();

alter table foster_placement_requests enable row level security;

create policy foster_placement_requests_select on foster_placement_requests
  for select to authenticated using (
    requested_by = auth.uid()
    or exists (select 1 from foster_profiles f where f.id = foster_profile_id and f.user_id = auth.uid())
    or is_case_creator(case_id)
    or is_case_coordinator(case_id)
    or is_moderator_or_admin()
  );

create policy foster_placement_requests_insert on foster_placement_requests
  for insert to authenticated with check (
    requested_by = auth.uid()
    and not current_profile_is_suspended()
    and (is_case_creator(case_id) or is_case_coordinator(case_id) or is_moderator_or_admin())
  );

create policy foster_placement_requests_update on foster_placement_requests
  for update to authenticated
  using (
    requested_by = auth.uid()
    or exists (select 1 from foster_profiles f where f.id = foster_profile_id and f.user_id = auth.uid())
    or is_moderator_or_admin()
  )
  with check (
    requested_by = auth.uid()
    or exists (select 1 from foster_profiles f where f.id = foster_profile_id and f.user_id = auth.uid())
    or is_moderator_or_admin()
  );
