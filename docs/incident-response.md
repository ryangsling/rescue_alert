# Incident response

Covers PRD acceptance criterion 17 (a documented incident, moderation, and data-recovery procedure) and security requirement 21 ("maintain a documented security and moderation incident process"). This is a small pilot with no dedicated on-call rotation - the procedures below assume a single responsible developer/coordinator acting quickly, not a team paging system.

## 1. Web deployment incident (bad production release)

1. Check `vercel inspect <deployment-url>` or the Vercel dashboard for the failing deployment's build/runtime logs.
2. Roll back immediately, don't wait on a fix: `vercel rollback <previous-deployment-url-or-id>` (project `rescue-alert-web`). This repoints the `rescue-alert-web.vercel.app` alias to the last good deployment within minutes.
3. Fix forward on a branch, verify with the full local checks (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) and a fresh `vercel deploy` (non-production) before promoting with `vercel deploy --prod` again.

## 2. Database migration incident (bad schema change on the live project)

1. **Stop.** Do not apply further migrations to the live project until the issue is understood.
2. Check `mcp__supabase__get_advisors` (security and performance) immediately after any migration - this has caught real issues in this project before (see `docs/PLAN.md` Part 11/19/20).
3. If the migration is additive and reversible (a new column, function, or table), write a new migration that drops/reverts it - never hand-edit the live schema outside a migration file.
4. If data was corrupted or lost, restore from the most recent logical backup (see "Data recovery" below) into a **new scratch Supabase project first**, verify the restored state there, and only then decide whether to restore the production project itself in place (which causes downtime - see Supabase's own restore docs).
5. Write up what happened in `docs/PLAN.md`'s running history for the relevant part, including the root cause - this project's standing discipline is to disclose real bugs found, not silently patch them.

## 3. Data recovery

This project is on Supabase's **free tier, which has no automatic backups** (confirmed directly against Supabase's docs during Part 20 - daily backups are a Pro-plan-and-above feature only). Recovery depends entirely on the scheduled logical backup workflow:

- `.github/workflows/backup.yml` runs `pg_dump` against the live project on a schedule and uploads the dump as a workflow artifact (see that file for the exact schedule and retention).
- To restore: download the latest artifact from the GitHub Actions run, then `psql <connection-string> < dump.sql` against a **new** Supabase project to verify it restores cleanly before ever pointing it at production data.
- If the GitHub Actions backup has not run recently or is missing (check the Actions tab), the manual fallback is `supabase db dump --db-url <connection-string> -f backup.sql` run locally with the project's database password (Settings → Database in the Supabase dashboard).
- **Known gap:** nothing currently automates a restore-and-verify drill. Run one manually before the pilot goes live, and periodically afterward - an untested backup is not a backup.

## 4. Security incident (leaked credential, suspected compromise)

1. Identify which credential: Supabase service-role key, Supabase publishable key, database password, GitHub Actions secret, Vercel token, EAS/Expo credentials, or push credentials (FCM service account / APNs key).
2. Rotate it immediately:
   - Supabase keys/DB password: Supabase dashboard → Settings → API / Database. Update `gh secret set` for every secret used in CI (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`) and `.env.local` on every developer machine.
   - FCM/APNs: re-upload via `eas credentials` (see PAUSE 2 in `docs/PLAN.md`).
3. Check `mcp__supabase__query_logs` and the Supabase dashboard's auth logs for unusual activity in the affected window.
4. If user data may have been exposed, this is also a moderation/communication incident - see section 6.

## 5. Moderation incident (abuse, false reports, unsafe content spreading faster than the queue)

1. Triage through the existing critical-case and reported-content queues (`docs/moderation-policy.md`) first - most incidents are a volume problem, not a missing-feature problem.
2. For content that must come down immediately pending review: hide it (`moderation_set_comment_hidden`/`_reply_hidden`/`_media_hidden`), don't wait for the full review to resolve the report.
3. For an account actively causing harm: `issue_account_restriction(user_id, 'suspended', reason)` blocks the account at the RLS layer immediately; escalate to `banned` only after review.
4. If the incident involves a credible safety concern (suspected cruelty with an identifiable person, PRD open question 8) - this product does not make legal determinations. Document it, redact what's necessary (`redact_case_sensitive_info`), and escalate outside the app to the appropriate local authority; this is explicitly out of scope for in-app resolution.
5. Every action taken is already audited (`moderation_actions`) - the incident write-up should reference the relevant `moderation_actions` rows, not duplicate them.

## 6. Communicating during an incident

For a pilot of this size, direct communication with affected pilot volunteers/coordinators (not a public status page) is appropriate. Record what was communicated and when in the same write-up as the technical root cause.

## Known gaps in this process (disclosed)

- No automated alerting exists for any of the operational signals in PRD section 23 (active cases, unanswered critical cases, notification failures, upload failures, open moderation reports, database/function errors, suspicious report spikes) - detection today is manual, by checking the dashboard and Supabase's own logs. See the "Operational dashboard" section of the Part 20 summary in `docs/PLAN.md` for what exists and what doesn't.
- No restore-and-verify drill has actually been run against the new backup workflow as of this writing - see section 3.
- No on-call rotation or paging system - appropriate for a single-area closed pilot, not for anything larger.
