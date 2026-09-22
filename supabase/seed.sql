-- Rescue Alert seed data.
--
-- animal_types and achievements are real reference data, applied to
-- every environment (including production) - the app cannot function
-- without at least one animal type to select in the report flow.
--
-- The block below "Local development test data" creates fake auth
-- users directly and must never run against a production project.

-- ---------------------------------------------------------------
-- Reference data (all environments)
-- ---------------------------------------------------------------

insert into animal_types (slug, label_en, label_bn, sort_order) values
  ('dog', 'Dog', 'কুকুর', 1),
  ('cat', 'Cat', 'বিড়াল', 2),
  ('cow', 'Cow', 'গরু', 3),
  ('goat', 'Goat', 'ছাগল', 4),
  ('bird', 'Bird', 'পাখি', 5),
  ('other', 'Other', 'অন্যান্য', 6)
on conflict (slug) do nothing;

insert into achievements (slug, label_en, label_bn, description_en, description_bn) values
  ('first_verified_rescue', 'First rescue', 'প্রথম উদ্ধার', 'Completed a verified on-site rescue.', 'একটি যাচাইকৃত উদ্ধার সম্পন্ন করেছেন।'),
  ('first_verified_transport', 'First transport', 'প্রথম পরিবহন', 'Completed a verified transport contribution.', 'একটি যাচাইকৃত পরিবহন অবদান সম্পন্ন করেছেন।'),
  ('first_verified_foster', 'First foster', 'প্রথম ফস্টার', 'Completed a verified foster placement.', 'একটি যাচাইকৃত ফস্টার প্লেসমেন্ট সম্পন্ন করেছেন।')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- Local development test data - DO NOT run against production.
-- Creates auth.users rows directly, bypassing normal signup.
-- ---------------------------------------------------------------

do $$
begin
  if current_setting('rescue_alert.seed_dev_data', true) = 'true' then

    insert into auth.users (id, email) values
      ('00000000-0000-0000-0000-000000000101', 'dev-reporter@example.test'),
      ('00000000-0000-0000-0000-000000000102', 'dev-responder@example.test'),
      ('00000000-0000-0000-0000-000000000103', 'dev-moderator@example.test')
    on conflict (id) do nothing;

    insert into profiles (id, full_name, city, area, role) values
      ('00000000-0000-0000-0000-000000000101', 'Dev Reporter', 'Dhaka', 'Dhanmondi', 'registered_user'),
      ('00000000-0000-0000-0000-000000000102', 'Dev Responder', 'Dhaka', 'Mohammadpur', 'registered_user'),
      ('00000000-0000-0000-0000-000000000103', 'Dev Moderator', 'Dhaka', 'Gulshan', 'moderator')
    on conflict (id) do nothing;

    insert into rescue_cases (
      id, creator_id, incident_type, animal_type_id, urgency, status,
      title, description, location, division, district, upazila_or_thana, landmark
    ) values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000101',
      'injured_animal',
      (select id from animal_types where slug = 'dog'),
      'urgent',
      'open',
      'Injured dog near Dhanmondi 27',
      'Dev seed case for local testing.',
      st_setsrid(st_makepoint(90.3742, 23.7461), 4326)::geography,
      'Dhaka',
      'Dhaka',
      'Dhanmondi',
      'Near Dhanmondi Lake, gate 4'
    )
    on conflict (id) do nothing;

  end if;
end $$;
