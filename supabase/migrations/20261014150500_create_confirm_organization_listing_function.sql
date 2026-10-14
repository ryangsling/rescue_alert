-- ORG-007: a directory record carries a last-confirmed date; this is
-- the only way to bump it - a plain field update would let any
-- ordinary organizations_update touch it incidentally, which would
-- make "last confirmed" meaningless as a deliberate attestation.
create or replace function confirm_organization_listing(p_organization_id uuid)
returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org organizations;
begin
  if not (is_org_admin(p_organization_id) or is_moderator_or_admin()) then
    raise exception 'only an organization administrator or a moderator may confirm this listing';
  end if;

  update organizations
  set last_confirmed_at = now()
  where id = p_organization_id
  returning * into v_org;

  if not found then
    raise exception 'organization_not_found: %', p_organization_id;
  end if;

  return v_org;
end;
$$;

revoke all on function confirm_organization_listing(uuid) from public, anon;
grant execute on function confirm_organization_listing(uuid) to authenticated;
