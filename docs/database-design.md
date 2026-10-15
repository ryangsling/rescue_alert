# Database design

Supabase Cloud project `taiemahdkbnsgegvjafa` (org "Team Bara", free tier, region `ap-southeast-1`). PostgreSQL with PostGIS. All schema changes are versioned migrations under `supabase/migrations/`, applied both to a local test database (`supabase/tests/run.sh`, also the CI `sql` job) and to the live project - never edited by hand on the live project.

## Core tables

Grouped by area; every table listed has Row Level Security enabled with deny-by-default policies (PRD 21, AGENTS.md standard 2).

**Identity and preferences**
`profiles`, `user_private_details` (phone, normalized `+8801XXXXXXXXX`, owner-only), `user_devices` (Expo push tokens, invalid ones marked `is_active = false` rather than deleted so delivery history survives), `notification_preferences` (static chosen `base_location` + `alert_radius_km`, never a tracked position), `user_preferred_animal_types`, `volunteer_capabilities`, `user_availability`.

**Cases** (PRD 18.2)
`rescue_cases` is the center of the schema. `location` is the exact operational coordinate; `approximate_location` is server-derived by the `derive_approximate_location()` trigger and is the only coordinate a general signed-in user ever sees - the exact one unlocks only for accepted responders, the case coordinator, and moderators (the project's own "exact coordinates unlock on commitment" decision, AGENTS.md). `case_status_history` is written only by `transition_case_status()`, never directly, and captures actor/timestamp/previous/new/reason for every change. `case_status_transitions` is the data-driven legal-transition table (8 rows) that function enforces against - editing it changes what moves are allowed with no code change.

**Response and coordination** (PRD section 8)
`case_responses` (a case may have many; a partial unique index enforces one live commitment per responder), `case_needs` (kept in sync with response status by trigger, including reopening a need if a confirmed response is later declined), `case_updates` (official updates, author-restricted and visually distinct from comments), `case_comments`, `comment_replies`, `case_watchers`.

**Media**
`rescue_media` - `storage_path` points into Supabase Storage; `exif_stripped` must be true before a path is ever exposed publicly; `is_hidden` is moderator-controlled (Part 15).

**Closure and history** (PRD section 9)
`rescue_outcomes` (one per case; `follow_up_case_id` links a newly created foster/treatment/adoption case), `contributions` (unverified until `verified_by`/`verified_at` is set by an authorized confirmer - this is what becomes a volunteer's rescue history), `achievements`/`user_achievements` (verified-contribution badges only - no leaderboard is ever built from these, PRD constraint).

**Organizations and directory** (PRD section 6)
`organizations` (verification moves `pending -> verified/rejected` only via moderator/admin), `organization_members`, `organization_services`, `organization_availability` (an org is dispatched only for the urgency levels/incident types it opted into), `clinics`, `shelters`, `foster_profiles`, `foster_supported_animal_types`, `foster_placement_requests` (approval is what unlocks `get_foster_address()` for that case).

**Moderation and audit** (PRD section 24)
`content_reports` (polymorphic `target_id`/`target_type`, resolved in application code, no FK), `moderation_actions` (every moderation action, `reason` required), `account_restrictions`, `moderation_appeals` (one per restriction - a repeat complaint is a reply on the existing appeal), `audit_logs` (privileged operations not already covered by `case_status_history` or `moderation_actions`, e.g. role changes, organization verification).

**Notifications** (Part 11)
`alert_escalation_steps` (the radius/timing ladder - editable, no code change needed), `notifications` (in-app inbox), `notification_deliveries` (one row per push attempt; `accepted` means only that Expo's service took it, never that the user saw it), `rescue_case_locations` (per-case location history where relevant).

## Key functions

All in `public`, most `security invoker` by default; the ones marked `security definer` below are deliberate and each has a matching advisor review.

- **`create_case(...)`** - one atomic, idempotent case creation (an idempotency key makes a retried submit return the same row rather than create a duplicate). 13 parameters as of Part 17 (added `p_hazard_flags`).
- **`transition_case_status(p_case_id, p_new_status, p_actor_id, p_reason)`** - the only way `rescue_cases.status` changes. Checks `case_status_transitions` for legality and `requires_moderator` for actor authorization, raises `illegal_status_transition` or `requires_moderator` otherwise. Exhaustively tested against all 380 ordered pairs of the 20-value `case_status` enum (`supabase/tests/idempotency_and_transitions.test.sql`).
- **`close_case(...)`** - structured closure: a selected outcome, a final update, and contribution verification in one call.
- **`derive_approximate_location()`** (trigger) - computes the public-safe point from the exact one on insert/update.
- **`find_alert_candidates(p_case_id, p_radius_km)`** - the PostGIS proximity query (GiST index on `notification_preferences.base_location`), filtered by radius, capability, availability, `min_urgency`, preferred animal types, trust status, and existing commitment.
- **`dispatch_case_alerts(p_case_id)`** / the `dispatch-alerts` Edge Function - radius-expanding alert dispatch on a one-minute `pg_cron` schedule, deduplicated by a partial unique index.
- **`merge_duplicate_cases(p_source_case_id, p_target_case_id, p_reason)`** - reparents comments/updates/responses/media/reports onto the target, deduplicates needs/contributions/watchers without data loss, marks the source `duplicate`.
- **`update_my_notification_preferences(p_base_location, p_alert_radius_km)`** - the only client-reachable way to set a volunteer's alert base point (Part 11 follow-up; see docs/PLAN.md Part 11 "Not done").

## Geospatial indexing

Every table with a `geography(Point, 4326)` column (`rescue_cases.location`/`approximate_location`, `notification_preferences.base_location`) has a GiST index. Matching never scans all users - confirmed by `EXPLAIN` plan inspection against 20,000 seeded volunteers in the SQL test suite, asserting an index scan and no sequential scan.

## Testing discipline

Every guarantee above is backed by a `supabase/tests/*.test.sql` file run against a real `postgis/postgis:17-3.5` container, both locally and in CI (`sql` job). RLS policies are tested per role, not assumed. See `docs/PLAN.md` for the part-by-part history of what was built, what bugs were found, and what remains disclosed as not done.
