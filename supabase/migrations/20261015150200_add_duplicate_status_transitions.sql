-- MOD-004: a duplicate can be discovered at any live stage, not only
-- while a case is still submitted/under_review/open. Mirrors the
-- already-broad closed_by_moderator pattern.
insert into case_status_transitions (from_status, to_status, requires_moderator) values
  ('response_committed', 'duplicate', true),
  ('responder_en_route', 'duplicate', true),
  ('animal_located', 'duplicate', true),
  ('rescue_in_progress', 'duplicate', true),
  ('transporting', 'duplicate', true),
  ('at_clinic_foster_shelter', 'duplicate', true),
  ('follow_up_required', 'duplicate', true),
  ('resolved', 'duplicate', true);
