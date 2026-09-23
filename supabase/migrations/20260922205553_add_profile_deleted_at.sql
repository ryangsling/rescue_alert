-- AUTH-008: account deletion cannot be a hard delete of the profile
-- row, since rescue_cases.creator_id, case_comments.author_id, and
-- every other content-authorship/audit-trail FK referencing profiles
-- is deliberately ON DELETE NO ACTION (proven directly: an attempted
-- delete of a profile with an authored case fails with a foreign key
-- violation) - preserving audit/attribution integrity is required by
-- AGENTS.md's "structured closure and audit trail". Account deletion
-- is instead: anonymize personal data on this row, keep the row, and
-- ban the underlying auth.users account so it can never sign in again
-- (done in the delete-account Edge Function).
alter table profiles add column deleted_at timestamptz;

comment on column profiles.deleted_at is 'AUTH-008: set by the delete-account Edge Function. The row is kept (never hard-deleted) so authored cases/comments/audit entries keep a valid reference; personal fields are cleared at the same time.';

-- Defense in depth: even if a pre-ban session token is still valid
-- for the short window before admin.signOut propagates, a deleted
-- account should be treated the same as a suspended one.
create or replace function current_profile_is_suspended() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_suspended or deleted_at is not null from profiles where id = auth.uid()), true);
$$;
