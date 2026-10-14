-- Part 14 (PRD 5.4): the only sanctioned way to read a foster's
-- exact address. Same shape as get_case_exact_location()/
-- get_responder_phone() - a narrow SECURITY DEFINER function, never a
-- direct column grant.
create or replace function get_foster_address(p_foster_profile_id uuid)
returns text
language sql stable security definer set search_path = public as $$
  select f.address
  from foster_profiles f
  where f.id = p_foster_profile_id
    and (
      f.user_id = auth.uid()
      or is_moderator_or_admin()
      or exists (
        select 1 from foster_placement_requests r
        where r.foster_profile_id = f.id
          and r.status = 'approved'
          and (is_case_creator(r.case_id) or is_case_coordinator(r.case_id))
      )
    );
$$;

comment on function get_foster_address is 'PRD 5.4: returns null unless the caller is the foster themselves, a moderator/administrator, or the creator/coordinator of a case with an approved placement request for this foster.';

revoke all on function get_foster_address(uuid) from public, anon;
grant execute on function get_foster_address(uuid) to authenticated;
