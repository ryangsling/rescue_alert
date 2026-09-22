# The Rescue Alert App

## Business Requirements

This project is building a location-aware community platform for reporting, coordinating, and documenting the rescue of stray and community animals in Bangladesh. Key features:

- **Structured rescue reporting** - a reporter creates a complete, actionable case in about two minutes with photos, incident type, urgency, animal type, visible condition, GPS or manually chosen location, and a landmark in বাংলা or English.
- **Proximity-based volunteer matching** - PostGIS geospatial queries select nearby volunteers by alert radius, capability, availability, preferred animal types, and quiet hours, then escalate the radius only while a case remains unanswered.
- **Multi-responder coordination** - volunteers commit to specific assistance types (on-site, transport, veterinary, foster, coordination), post official updates distinct from general comments, and see which needs remain unfilled.
- **Structured closure and audit trail** - every status change records actor, timestamp, previous status, new status, and reason; closure requires a selected outcome and a final update, and verified contributions become a volunteer's rescue history.
- **Moderation and verified organizations** - moderators review reports, merge duplicates, redact sensitive information, and restrict accounts, all audited; clinics, shelters, and NGOs opt in to the alert categories they want.
- **বাংলা and English throughout** - localization is a core requirement from the first component, not a later addition.

## Limitations

The MVP is a controlled community pilot in a constrained Dhaka area. Explicitly out of scope:

- No AI veterinary diagnosis, and no AI-assisted image or duplicate detection.
- No donations, payments, or fundraising of any kind.
- No live responder location sharing (deferred; PRD section 10.10).
- No built-in turn-by-turn navigation - the app hands off to an installed map application.
- No adoption marketplace and no lost-and-found matching.
- No public leaderboard or any popularity metric (no likes, no follower counts, no raw report counts).
- No phone-number sign-in. Phone is a private contact field only, verified after the pilot.
- No background location tracking and no continuous movement history.
- No SMS infrastructure, no video livestreaming, and no general-purpose social feed.
- No guaranteed emergency response - the product states this plainly in the interface.

## Technical Decisions

| Layer | Choice |
|---|---|
| Mobile | React Native with Expo |
| Web and administration | Next.js |
| Language | TypeScript |
| Monorepo | pnpm workspaces and Turborepo |
| Package manager | pnpm (not uv - this is a TypeScript project) |
| Backend platform | Supabase Cloud, free tier |
| Database | PostgreSQL with PostGIS |
| Authentication | Supabase Auth, email and password |
| Realtime | Supabase Realtime |
| Server logic | Supabase Edge Functions and PostgreSQL functions |
| Media | Supabase Storage with signed URLs |
| Push notifications | Expo Notifications over FCM and APNs |
| Maps | MapLibre React Native and MapLibre GL JS |
| Vector tiles | OpenFreeMap, with a Protomaps/PMTiles self-hosting path kept open |
| Offline drafts | Expo SQLite |
| Data fetching | TanStack Query |
| Client state | Zustand |
| Validation | Zod, shared between client and Edge Functions |
| Design system | Rescue UI - gluestack UI, NativeWind, shared TypeScript tokens |
| Testing | Vitest, React Native Testing Library, Playwright (web E2E), Maestro (mobile E2E) |
| CI | GitHub Actions |
| Hosting | Supabase Cloud plus Vercel free tier; Expo EAS for mobile builds |

Three decisions were made for this build rather than inherited from the PRD:

1. **MVP ships both apps in full.** The Expo app and the authenticated Next.js web app both support reporting, responding, and coordinating. The web app additionally carries public share pages and the moderation dashboard.
2. **Email and password only** (resolves PRD open question 11). Phone numbers are collected and normalized to `+8801XXXXXXXXX` but are private and are not a sign-in identifier during the pilot, avoiding SMS cost and phone-recycling account takeover.
3. **Exact coordinates unlock on commitment** (resolves PRD open question 4). Signed-in users see the approximate point, administrative area, and landmark. The exact operational coordinate is visible only to accepted responders, the case coordinator, and moderators.

Infrastructure is driven through tooling already authenticated on this machine: `gh` for repository and Actions secrets, `vercel` for project linking, environment variables, and deploys, and the Supabase MCP server for project creation, migrations, SQL, Edge Function deploys, and type generation.

## Starting Point

Greenfield. The repository contains `PRD.md`, `design/DESIGN.md`, `AGENTS.md`, `docs/PLAN.md`, and `prompt.txt` only. There is no application code, no `package.json`, and it is not yet a git repository.

## Design System

Reference: design/DESIGN.md (full spec)

- Palette: light `primary #0B6B58`, `background #FCFDFC`, `surface #FFFFFF`, `text #17201D`, `textMuted #58635F`, `border #CAD4D0`, `focus #006CFF`; status `critical #B3261E`, `urgent #9B4A00`, `support #1D5B9F`, `success #26734D`, `warning #765A00`, `neutral #58635F`; dark `primary #78D8BD`, `background #101512`, `surface #171D1A`, `text #E6ECE8`, `border #3E4944`
- Type: Inter for English and Latin, Noto Sans Bengali for বাংলা, system monospace only in technical administration views; weights bundled with the app, never downloaded at first launch
- Signature element: the **urgency status chip** - semantic background, icon, and text together, never colour alone - rendered identically on the case card, the case header, the map marker, and the push notification, so urgency reads the same everywhere it appears
- Constraints: red is reserved for critical state and destructive actions and is never used for notification counts; exact coordinates, phone numbers, and foster addresses are never rendered without authorization; no gamification during an unresolved rescue - no confetti, streaks, leaderboards, or like counts; no raw hex or pixel values in feature components, tokens only
- Motion: one brief `motion.standard` (200ms) transition confirming a state change such as an accepted response - map markers never pulse continuously, and reduced-motion settings are respected

## Coding Standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Project-Specific Standards

1. Use `pnpm` for everything - `pnpm add`, `pnpm dlx`, never npm or yarn.
2. Every table exposed to clients has Row Level Security enabled and denies by default; policies grant narrowly and are covered by tests for each role.
3. Privileged, multi-step, or cross-table mutations go in Edge Functions. Direct client access to Supabase is allowed only where RLS alone makes it safe.
4. Zod schemas live in `packages/validation` and are imported by both clients and Edge Functions. Never validate the same payload twice with two different definitions.
5. Database row types are generated from the schema. Never hand-write a type that mirrors a table.
6. Retryable writes - case creation, responses, notifications - take an idempotency key.
7. Add বাংলা and English message keys in the same commit. A key that exists in one catalogue and not the other fails CI.
8. Business rules stay out of UI components. Components receive resolved data and emit intent.
9. Geographic points use PostGIS `geography(Point, 4326)` with GiST indexes. Never scan all users to match a case.
10. Never expose the service-role key to a mobile or web client.
11. No emojis in code, comments, log lines, commit messages, or UI copy.

## Working Documentation

All documents for planning and executing this project are in the `docs/` directory, alongside the product and design specifications:

- `docs/PLAN.md` - the phase-by-phase implementation plan. Review before proceeding with any work.
- `PRD.md` - the full product requirements document.
- `design/DESIGN.md` - the complete Rescue UI design system specification.
