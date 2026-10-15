# Privacy model

Rescue Alert collects the minimum personal and location data needed to coordinate a rescue, and nothing is rendered without a specific authorization check. This document states exactly what is restricted, how it is enforced, and what remains an open decision for the pilot team.

## Location

- `rescue_cases.location` is the exact operational coordinate. `approximate_location` is computed from it by the `derive_approximate_location()` trigger and is the only coordinate a general signed-in user or the public share pages ever see.
- The exact coordinate is reachable only through `get_case_exact_location(p_case_id)`, which returns no row unless the caller is an accepted responder, the case coordinator, an org member, or a moderator/administrator (`is_case_participant()`). It returns plain `latitude`/`longitude` doubles, never a raw PostGIS value, and `anon`/unauthenticated callers cannot call it at all.
- `get_case_location_history(p_case_id)` is gated the same way.
- A volunteer's own alert base point (`notification_preferences.base_location`) is a static point they choose, never a tracked or continuously updated position - there is no background location tracking anywhere in this app (AGENTS.md non-goal).

## Phone numbers

- `user_private_details.phone_normalized` (`+8801XXXXXXXXX`) is owner-only by RLS.
- A responder's phone becomes visible to the case creator or coordinator (or a moderator) only through `get_responder_phone(p_response_id)`, and only once that response's status is `confirmed` or `completed` - a response that is merely pending never exposes a phone number.
- Phone is never a sign-in identifier (AGENTS.md decision 2) - it exists only as a private contact field, reducing account-takeover risk from phone-number recycling.

## Foster addresses

- `foster_profiles.address` is reachable only through `get_foster_address(p_foster_profile_id)`, which returns null unless the caller is the foster themselves, a moderator/administrator, or the creator/coordinator of a case with an **approved** placement request for that foster (`foster_placement_requests.status = 'approved'`). A pending request unlocks nothing.

## Public share pages

The public (`anon`-reachable) pages at `/share/case/[publicReference]`, `/share/open-cases`, and `/share/rescues` are served by dedicated SECURITY DEFINER functions (`rescue_cases_public()`, `get_public_case_detail()`, `list_public_open_cases()`, `list_public_rescue_history()`) that select only: case/animal type, approximate area, status, approved media, required assistance, and the last official update - matching PRD section 25 exactly. They never return the exact coordinate, phone numbers, landmark text (landmark can itself be free-form and sensitive - see Redaction below), or any private contact field. Social-preview `og:image` signed URLs are generated through a narrowly scoped anon storage policy (`is_media_publicly_visible()`) rather than widening bucket access generally.

## Redaction and moderation

Moderators can redact a case's sensitive free text directly: `redact_case_sensitive_info(p_case_id, p_reason)` nulls `landmark` and sets `exact_location_visibility = 'restricted'`, which further narrows who can call `get_case_exact_location()` for that case beyond the normal participant check. Every moderation action, including redaction, is written to `moderation_actions` with a required `reason` - never silent.

## Media

`rescue_media.exif_stripped` must be true before a storage path is ever exposed publicly - EXIF GPS metadata (which can independently leak an exact location even when the database's own coordinate is approximate) is stripped client-side before upload (`packages/media`). Moderators can hide media (`moderation_set_media_hidden()`), which is enforced at the RLS SELECT policy, not just hidden in the UI.

## Account deletion and data minimization

- `requestAccountDeletion()` is a privileged Edge Function call (`delete-account`), not a direct client delete, so it can be audited and can enforce password re-entry.
- Analytics (PRD section 23) are scoped to operational events only - registration, report submitted, response committed, case closed, etc. - never continuous movement histories or free-text content.
- `achievements`/`user_achievements` exist only for verified-contribution badges; no raw report-count or popularity metric is ever surfaced (AGENTS.md non-goal), closing off a whole class of incidental personal-activity exposure.

## What is NOT yet decided (PRD open question 10)

PRD open question 10 - what retention period should apply to exact coordinates, media, comments, and audit logs - has not been resolved for this pilot. Nothing in the schema currently auto-expires any of this data. Before a broader-than-pilot launch, the team should set an explicit retention policy and, if one is chosen, implement it as a scheduled job (the same `pg_cron` infrastructure already used for alert dispatch could run a retention sweep). Until then, the pilot should treat this as a known gap, not an implemented control.
