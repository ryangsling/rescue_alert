-- Security advisor flagged incident_type_label_en (created in
-- create_case_title_generation.sql) for a mutable search_path -
-- missed when that function was first written. Fixed here rather
-- than editing history, matching this project's convention of never
-- rewriting an already-applied migration.
create or replace function incident_type_label_en(p_incident_type incident_type) returns text
language sql immutable set search_path = public as $$
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
