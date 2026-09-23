-- No step in PRD 7.2's case-creation flow collects a title from the
-- user, yet rescue_cases.title is NOT NULL - it is server-derived,
-- always overwriting any client-supplied value (same pattern as
-- derive_approximate_location: the client cannot be trusted to set
-- this, and a single canonical English title is what search, admin
-- views, and notification payloads need; screens re-synthesize a
-- localized display title from incident_type + animal_type + locale
-- for on-screen rendering, per RescueCaseCard already receiving a
-- pre-resolved `title` string rather than raw enum values).
create or replace function incident_type_label_en(p_incident_type incident_type) returns text
language sql immutable as $$
  select case p_incident_type
    when 'injured_animal' then 'Injured animal'
    when 'road_accident' then 'Road accident'
    when 'critically_ill_animal' then 'Critically ill animal'
    when 'trapped_animal' then 'Trapped animal'
    when 'abandoned_animal' then 'Abandoned animal'
    when 'abuse_or_cruelty_suspected' then 'Abuse or cruelty suspected'
    when 'mother_with_babies' then 'Mother with babies'
    when 'orphaned_babies' then 'Orphaned babies'
    when 'traffic_risk_animal' then 'Animal creating traffic risk'
    when 'temporary_foster_needed' then 'Temporary foster needed'
    when 'shelter_needed' then 'Shelter needed'
    when 'transport_needed' then 'Transport needed'
    when 'veterinary_treatment_needed' then 'Veterinary treatment needed'
    when 'lost_animal_found' then 'Lost animal found'
    when 'adoption_needed' then 'Adoption needed'
    when 'other_animal_welfare_concern' then 'Animal welfare concern'
  end;
$$;

create or replace function generate_case_title() returns trigger
language plpgsql set search_path = public as $$
declare
  v_animal_label text;
begin
  select label_en into v_animal_label from animal_types where id = new.animal_type_id;
  new.title := incident_type_label_en(new.incident_type) || ' - ' || coalesce(v_animal_label, 'Animal');
  return new;
end;
$$;

create trigger rescue_cases_generate_title
  before insert on rescue_cases
  for each row execute function generate_case_title();
