# Pilot operations playbook

A day-to-day guide for whoever is running the closed Dhaka pilot (PRD section 26, Phase 2). This is not a technical document - see `docs/incident-response.md` for that. This is "what do I actually do each day."

## Before the pilot opens

- [ ] Confirm the pilot geography (PRD open question 1 - not yet answered in this repo).
- [ ] Recruit and onboard pilot volunteers and at least one pilot coordinator who can act as a moderator.
- [ ] Onboard any participating clinics/organizations through the directory (Part 14) so they appear as referral options from day one, not added reactively.
- [ ] Walk through `docs/moderation-policy.md` with whoever will hold the moderator role - they should recognize every action before they need it under pressure.
- [ ] Run a restore-and-verify drill against the new backup workflow (see `docs/incident-response.md` section 3) - do this before real data exists, not after.
- [ ] Decide the alert-radius/escalation defaults (PRD open question 7) - `alert_escalation_steps` ships with defaults (critical: 2/5/10/20 km at 0/10/20/40 min; urgent: 5 km once); confirm these fit the pilot area's actual density before relying on them.

## Daily

- [ ] Check the critical case queue (moderation dashboard) - an unanswered critical case is the single most important thing to catch, every day, not just when someone complains.
- [ ] Check the reported-content queue - clear anything time-sensitive (cruelty, graphic content, harassment reports) same-day.
- [ ] Skim recent `case_status_history` for anything stuck in an unexpected state for an unusually long time (a case sitting in `response_committed` for days with no further update is worth a direct check-in with the responder).
- [ ] Spot-check that notifications are actually being delivered: `notification_deliveries` status distribution, and ask at least one active volunteer whether they're receiving alerts - the dispatcher reporting `202 accepted` only proves Expo took the push, never that a phone showed it.

## Weekly

- [ ] Review the audit log (`moderation_actions`, `audit_logs`) for the week - look for patterns, not just individual actions.
- [ ] Review any account restrictions issued and any appeals filed - appeals should not sit in `pending` for long.
- [ ] Check Supabase and Vercel usage against free-tier quotas (see "Quota monitoring" below) - a quota cutoff mid-pilot is an avoidable incident.
- [ ] Confirm the backup workflow actually ran (GitHub Actions tab) - don't assume a scheduled job is healthy just because nobody got paged.

## Quota monitoring (free tier)

Both Supabase and Vercel are on free tiers for this pilot (AGENTS.md's own hosting decision). Free tiers have hard caps, not graceful degradation in every case - check these explicitly rather than waiting for a failure:

- **Supabase**: dashboard → Project → Usage. Watch database size, Edge Function invocations, Realtime connections, and monthly active users. The free tier also pauses a project automatically after a period of inactivity - a pilot with daily real usage avoids this, but don't let a project sit idle during a planning gap.
- **Vercel**: dashboard → Project → Usage, or `vercel project inspect rescue-alert-web`. Watch bandwidth and function execution on the free (Hobby) plan.
- If either is trending toward its cap, that is a go/no-go decision for the pilot owner (upgrade vs. slow down rollout), not something to silently absorb.

## Recruiting and growth (PRD section 25)

Growth during the pilot should stay operational, not promotional: recruit experienced rescuers as coordinators, onboard clinics/organizations, and publish transparent outcome summaries from real `rescue_outcomes` data. Do not expand the geography until moderation response time and responder coverage are both holding up in the current area (PRD section 25's own explicit sequencing).

## বাংলা materials

Use `docs/bangla-terminology-guide.md` for consistent terminology when writing any pilot-facing material (onboarding handouts, safety briefings, announcements) that isn't pulled directly from the app's own localization catalog.
