-- Real security gap found auditing contributions' RLS for Part 13:
-- contributions_insert allows `user_id = auth.uid()` (a self-claim)
-- with no restriction at all on the verified_by/verified_at columns
-- in the same insert, so a user could insert their own contribution
-- row already marked verified by themselves. PRD 13.2 lists who may
-- verify a contribution (case creator, case coordinator, a verified
-- organization, a moderator, or consistent multi-participant
-- confirmation) and self-verification is not among them. "Consistent
-- confirmation from multiple participants" is not implemented here -
-- disclosed gap, not silently dropped.
create or replace function can_confirm_contribution(p_case_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_case_creator(p_case_id)
    or is_case_coordinator(p_case_id)
    or is_moderator_or_admin()
    or exists (
      select 1 from rescue_cases c
      join organization_members m on m.organization_id = c.organization_id
      where c.id = p_case_id and m.user_id = auth.uid()
    );
$$;

comment on function can_confirm_contribution is 'PRD 13.2 confirmers, minus "consistent confirmation from multiple participants" (not implemented).';

create or replace function guard_contribution_verification() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.verified_by is not null then
    if new.verified_by is distinct from auth.uid() then
      raise exception 'verified_by must be the confirming user themselves, never set on another user''s behalf';
    end if;
    if new.verified_by = new.user_id then
      raise exception 'a user may not verify their own contribution';
    end if;
    if not can_confirm_contribution(new.case_id) then
      raise exception 'verifying a contribution requires being the case creator, coordinator, an org member for the case, or a moderator';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.verified_by is not null
       and (new.verified_by, new.verified_at) is distinct from (old.verified_by, old.verified_at) then
      raise exception 'a verified contribution cannot be re-verified or changed';
    end if;
    if new.user_id <> old.user_id or new.case_id <> old.case_id or new.category <> old.category then
      raise exception 'user_id, case_id, and category are immutable once a contribution exists';
    end if;
  end if;

  return new;
end;
$$;

create trigger contributions_guard_verification
  before insert or update on contributions
  for each row execute function guard_contribution_verification();
