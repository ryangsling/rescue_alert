-- Minimal stand-ins for the Supabase platform pieces the migrations
-- reference, so the migrations and SQL tests run on plain
-- Postgres + PostGIS (local or CI). Not used against a real project.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

create schema auth;
create schema extensions;
create extension postgis with schema extensions;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid, metadata jsonb
);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:cardinality(string_to_array(name, '/')) - 1] $$;

create publication supabase_realtime;

grant usage on schema auth, extensions, storage to anon, authenticated, service_role;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
-- Real Supabase projects grant these at the platform level, outside
-- any migration this repo controls; stand in for that here so RLS on
-- storage.objects is actually exercised, not vacuously permission-denied.
grant select, insert, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;

-- Supabase grants new public objects to these roles by name; mimic it so
-- the migrations' explicit revokes are what actually narrows access.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
