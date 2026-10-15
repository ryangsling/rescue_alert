# Moderation policy

This is the operating policy for the moderator/administrator dashboard built in Part 15 (`apps/web/src/app/moderation/`). It covers every PRD section 24 capability. All actions below are audited (`moderation_actions`, required `reason` field) and destructive actions require a typed reason before they take effect - there is no undo for most of them, by design, so the reason is the record of judgment.

## Who can moderate

Role is read from `profiles` via `is_moderator_or_admin()`. There are two levels: moderator and administrator. Administrators additionally manage `alert_escalation_steps` and `animal_types` configuration; both levels can act on content, cases, and accounts.

## Queues

- **Critical case queue** (`listCriticalCaseQueue`/`listUnansweredCriticalCases`) - critical/urgent cases with no committed responder. This is the highest-priority queue: an unanswered critical case is the scenario the whole alert-escalation system exists to prevent, so a moderator seeing one here should treat it as an active incident, not a backlog item.
- **Reported content queue** (`listContentReports`/`updateContentReportStatus`) - reports against a case, comment, profile, or media (`report_target_type`), with reasons `spam`, `duplicate`, `fraud`, `cruelty`, `graphic_content`, `unsafe_advice`, `harassment`, `privacy_exposure`, or other. Status moves `open -> reviewing -> resolved`/`dismissed`.

## Actions and when to use them

| Action                         | Function                                                            | When                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hide content                   | `moderation_set_comment_hidden` / `_reply_hidden` / `_media_hidden` | Content violates policy but the case itself is legitimate. Distinct from a user's own self-hide (Part 12) - this is moderator-only and enforced at the RLS SELECT policy, not just the UI.                                                                                                                       |
| Merge duplicates               | `merge_duplicate_cases(source, target, reason)`                     | Two reports describe the same incident. Reparents comments/updates/responses/media/reports onto the target, deduplicates needs/contributions/watchers, marks the source `duplicate`. **Irreversible** - verify the match carefully before merging.                                                               |
| Redact sensitive info          | `redact_case_sensitive_info(case_id, reason)`                       | A landmark or free-text field leaks something it shouldn't (an identifiable person, a precise address written in free text). Nulls `landmark`, sets `exact_location_visibility = 'restricted'`.                                                                                                                  |
| Issue/lift account restriction | `issue_account_restriction` / `lift_account_restriction`            | Four levels: `warning`, `restricted`, `suspended`, `banned`. Only `suspended`/`banned` actually block the account (`profiles.is_suspended`) - `warning`/`restricted` are recorded but not enforced at the RLS layer, so use them when the record itself (and the appeal path) is the point, not an access block. |
| Correct case status            | part of `transition_case_status` with moderator authorization       | Use when a case is stuck in an incorrect state the normal actor-driven transitions can't fix (e.g. a reporter went silent mid-flow). Still goes through the same legal-transition table as every other status change - a moderator cannot skip to an illegal state.                                              |
| Review appeal                  | `reviewModerationAppeal`                                            | One appeal per restriction (`moderation_appeals`, unique on `restriction_id`) - status moves `pending -> upheld`/`overturned`. A trigger (`moderation_appeals_guard`) prevents a moderator from reviewing their own restriction decision.                                                                        |

## Audit log

Every action above writes to `moderation_actions`. `audit_logs` separately covers privileged operations not already captured there (role changes, organization verification). Both are reviewable in the dashboard's audit-log viewer, filterable by actor, target, and action type. There is deliberately no edit or delete path for these tables from the application layer.

## Configuration (administrator only)

`alert_escalation_steps` (the radius/timing ladder from Part 11) and `animal_types` are both editable from the dashboard - changing a row changes system behavior immediately, with no code deploy. Treat radius/timing changes as an operational decision, not a casual one: widening a radius too far during the pilot risks alert fatigue in PRD's own risk table (section 29).

## Known gaps (carried from Part 15/19, disclosed, not silently dropped)

- No graphic-media blur rendering yet - hiding media removes it from view entirely; there is no "tap to reveal" blur step.
- No WCAG 2.2 AA certification pass, TalkBack/VoiceOver testing, or keyboard-only testing of the dashboard - the inline-alert-role fix from Part 17 covers screen-reader announcement of errors, not a full accessibility audit.
- No E2E coverage of the moderator action flows specifically (the web E2E suite from Part 19 covers only public, unauthenticated pages - there is no seeded moderator test account on the live project).
