-- Part 13 (OUT-001..004): the single sanctioned way to close a case.
-- Mirrors transition_case_status's own pattern - derives the actor
-- from auth.uid() itself rather than trusting a client-supplied id,
-- after the actor-spoofing bug fixed earlier in this part.
create or replace function close_case(
  p_case_id uuid,
  p_outcome closure_outcome,
  p_final_update text,
  p_follow_up_case_id uuid default null,
  p_contributions jsonb default null,
  p_reason text default null
) returns rescue_outcomes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor profiles;
  v_case rescue_cases;
  v_outcome rescue_outcomes;
  v_contribution jsonb;
begin
  if v_actor_id is null then
    raise exception 'authentication_required';
  end if;

  if coalesce(trim(p_final_update), '') = '' then
    raise exception 'final_update_required';
  end if;

  select * into v_case from rescue_cases where id = p_case_id for update;
  if not found then
    raise exception 'case_not_found: %', p_case_id;
  end if;

  if v_case.status in ('closed', 'closed_by_moderator') then
    raise exception 'case_already_closed';
  end if;

  if not (is_case_creator(p_case_id) or is_case_coordinator(p_case_id) or is_moderator_or_admin()) then
    raise exception 'not_authorized_to_close_case';
  end if;

  select * into v_actor from profiles where id = v_actor_id;
  if v_actor.is_suspended then
    raise exception 'actor_suspended';
  end if;

  insert into case_updates (case_id, author_id, body, is_pinned)
  values (p_case_id, v_actor_id, p_final_update, true);

  perform transition_case_status(p_case_id, 'closed', v_actor_id, p_reason);

  insert into rescue_outcomes (case_id, outcome, final_update, recorded_by, follow_up_case_id)
  values (p_case_id, p_outcome, p_final_update, v_actor_id, p_follow_up_case_id)
  returning * into v_outcome;

  if p_contributions is not null then
    for v_contribution in select * from jsonb_array_elements(p_contributions)
    loop
      begin
        insert into contributions (user_id, case_id, category, verified_by, verified_at)
        values (
          (v_contribution->>'user_id')::uuid,
          p_case_id,
          (v_contribution->>'category')::contribution_category,
          v_actor_id,
          now()
        )
        on conflict (user_id, case_id, category) do update
          set verified_by = excluded.verified_by, verified_at = excluded.verified_at
          where contributions.verified_by is null;
      exception when others then
        -- A single invalid credit (e.g. the closer naming
        -- themselves, which guard_contribution_verification
        -- rejects as self-verification) must not block the
        -- closure itself.
        null;
      end;
    end loop;
  end if;

  return v_outcome;
end;
$$;

comment on function close_case is 'OUT-001..004: requires an outcome and a non-empty final update, transitions the case to closed, records rescue_outcomes, and optionally credits already-verified contributions. The actor is always auth.uid(), never a client-supplied id.';

revoke all on function close_case(uuid, closure_outcome, text, uuid, jsonb, text) from public, anon;
grant execute on function close_case(uuid, closure_outcome, text, uuid, jsonb, text) to authenticated;

create or replace function get_user_rescue_history(p_user_id uuid)
returns table (
  case_id uuid,
  public_reference text,
  category contribution_category,
  outcome closure_outcome,
  case_title text,
  closed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.case_id,
    rc.public_reference,
    c.category,
    ro.outcome,
    rc.title,
    rc.closed_at
  from contributions c
  join rescue_cases rc on rc.id = c.case_id
  left join rescue_outcomes ro on ro.case_id = c.case_id
  where c.user_id = p_user_id and c.verified_by is not null
  order by rc.closed_at desc nulls last;
$$;

comment on function get_user_rescue_history is 'OUT-006, PROF-006: verified contributions only. Deliberately excludes rescue_cases.location/approximate_location, landmark, and every contact field - privacy-reviewed by construction, safe for anon (the eventual public profile page, Part 16).';

revoke all on function get_user_rescue_history(uuid) from public;
grant execute on function get_user_rescue_history(uuid) to anon, authenticated;
