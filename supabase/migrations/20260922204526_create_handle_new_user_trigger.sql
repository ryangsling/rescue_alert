-- AUTH-001, AUTH-002: provisions profiles and user_private_details
-- atomically when a Supabase Auth user is created, from metadata the
-- client passes to auth.signUp(). Runs as security definer so it can
-- write these tables regardless of RLS - there is no authenticated
-- session yet at this point, since email confirmation may still be
-- pending (PRD 7.1 step 4 happens after this).
--
-- Consent timestamps are stamped server-side (now()) rather than
-- trusting a client-supplied timestamp in metadata: the client only
-- sends boolean acceptance flags. All four are required; a missing
-- or false flag aborts the signup with a clear error rather than
-- silently creating an account with unrecorded consent.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if not coalesce((meta->>'terms_accepted')::boolean, false)
    or not coalesce((meta->>'privacy_notice_accepted')::boolean, false)
    or not coalesce((meta->>'location_policy_accepted')::boolean, false)
    or not coalesce((meta->>'community_rules_accepted')::boolean, false)
  then
    raise exception 'terms, privacy notice, location policy, and community rules must all be accepted';
  end if;

  insert into profiles (id, full_name, city, area, preferred_language)
  values (
    new.id,
    meta->>'full_name',
    nullif(meta->>'city', ''),
    nullif(meta->>'area', ''),
    coalesce((meta->>'preferred_language')::app_language, 'en')
  );

  insert into user_private_details (
    user_id, email, phone_normalized,
    terms_accepted_at, privacy_notice_accepted_at,
    location_policy_accepted_at, community_rules_accepted_at
  )
  values (
    new.id, new.email, nullif(meta->>'phone_normalized', ''),
    now(), now(), now(), now()
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
