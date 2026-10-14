-- Part 14 (ORG-003, ORG-007): the public organization/clinic/shelter
-- directory. A security definer function, not a bare view over an
-- RLS table (the same "security_definer_view" lint already fixed
-- once for rescue_cases_public() - a view bypasses RLS silently, a
-- function is the auditable, intentional equivalent). Anon-safe by
-- construction: only verified organizations, and nothing here is
-- sensitive (no foster address, no member identities beyond what the
-- org itself chooses to publish as a service).
create or replace function list_verified_directory()
returns table (
  id uuid,
  name text,
  org_type organization_type,
  service_area text,
  contact_method text,
  description text,
  last_confirmed_at timestamptz,
  is_currently_available boolean,
  hours_text text,
  clinic_specializations text,
  clinic_emergency_capable boolean,
  shelter_capacity_total integer,
  shelter_capacity_available integer,
  services jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.name,
    o.org_type,
    o.service_area,
    o.contact_method,
    o.description,
    o.last_confirmed_at,
    a.is_currently_available,
    a.hours_text,
    c.specializations,
    c.emergency_capable,
    s.capacity_total,
    s.capacity_available,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('name', svc.service_name, 'description', svc.description) order by svc.created_at)
        from organization_services svc
        where svc.organization_id = o.id
      ),
      '[]'::jsonb
    )
  from organizations o
  left join organization_availability a on a.organization_id = o.id
  left join clinics c on c.organization_id = o.id
  left join shelters s on s.organization_id = o.id
  where o.verification_status = 'verified'
  order by o.name;
$$;

comment on function list_verified_directory is 'ORG-003/ORG-007: the public directory. Never selects foster_profiles - PRD 5.4 keeps foster discovery signed-in-only, not a public listing.';

revoke all on function list_verified_directory() from public;
grant execute on function list_verified_directory() to anon, authenticated;
