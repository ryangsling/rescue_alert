-- Part 10 "bounded realtime subscriptions" - proven empirically that
-- this was actually required: `select * from pg_publication_tables
-- where pubname = 'supabase_realtime'` returned zero rows before this
-- migration, meaning no table (not just rescue_cases) was ever
-- broadcasting postgres_changes events. Without this, the client-side
-- .channel(...).on('postgres_changes', ...) subscriptions in
-- FeedList.tsx/index.tsx would be structurally correct but silently
-- never fire.
alter publication supabase_realtime add table rescue_cases;
