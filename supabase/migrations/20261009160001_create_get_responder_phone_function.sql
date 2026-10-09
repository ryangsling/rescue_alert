-- Part 12 gap: ResponderCard has had isAuthorizedViewer/phoneNumber
-- props since Part 5, but nothing ever let a creator/coordinator
-- actually read a responder's phone - get_case_exact_location() is
-- the only comparable "sensitive info, authorized viewers only"
-- function that existed. user_private_details is owner-only (RLS),
-- so direct client access was never possible, by design.
--
-- "Accepted" mirrors case_responses_update's own gate for
-- confirmed_by (PRD 11.x "accepted responder"): confirmed or
-- completed, never a merely committed, declined, or withdrawn offer.
create or replace function get_responder_phone(p_response_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select d.phone_normalized
  from case_responses r
  join user_private_details d on d.user_id = r.responder_id
  where r.id = p_response_id
    and r.status in ('confirmed', 'completed')
    and (
      is_case_creator(r.case_id)
      or is_case_coordinator(r.case_id)
      or is_moderator_or_admin()
    );
$$;

comment on function get_responder_phone is 'Returns null unless the response is confirmed/completed and the caller is the case creator, coordinator, or a moderator/administrator - mirrors get_case_exact_location()''s shape.';

revoke all on function get_responder_phone(uuid) from public;
grant execute on function get_responder_phone(uuid) to authenticated;
