# Project Plan - Rescue Alert MVP

## Goal and approach

Build a location-aware animal rescue coordination platform for Bangladesh with:
1. A Supabase backend - PostGIS schema, Row Level Security, Edge Functions, Storage, and geospatial volunteer matching
2. A shared TypeScript layer - Rescue UI design system, validation schemas, localization, and generated database types
3. An Expo mobile application for reporting, responding, and coordinating rescues
4. A Next.js web application carrying the same authenticated workflows plus public share pages and the moderation dashboard

Execution will proceed in gated phases. Part 1 is a hard gate: no implementation beyond planning until plan approval.

## Quality bar and testing policy

- Unit coverage target: **minimum 80%**, with emphasis on critical behavior, not metric gaming.
- Integration testing: robust API + frontend/backend flow coverage for core user journeys.
- E2E testing: at least one happy path plus selected failure-path checks for key flows.

Additionally, for this project specifically:

- Row Level Security policies are tested for every role - guest, registered user, trusted volunteer, organization member, organization administrator, moderator, administrator.
- Status transitions, geospatial matching, and notification deduplication each have dedicated test suites.
- No part is complete while its tests are failing or skipped.

## Current implementation status

- **Completed:** Parts 1-2
- **Pending:** Parts 3 through 20

## Confirmed design decisions

| Decision | Choice | Resolves |
|---|---|---|
| MVP app scope | Full Expo mobile app and full authenticated Next.js web app, plus public share pages and admin dashboard | - |
| Authentication | Email and password only. Phone stored privately, normalized `+8801XXXXXXXXX`, verified post-MVP | PRD open question 11 |
| Exact location visibility | Approximate point, area, and landmark for all signed-in users. Exact coordinate unlocks for accepted responders, coordinators, and moderators only | PRD open question 4 |
| Hosting | Supabase Cloud free tier plus Vercel free tier; Expo EAS for mobile builds | - |

Tooling available on the development machine, which determines what stays manual:

| Capability | State | Consequence |
|---|---|---|
| `gh` CLI | Authenticated, scopes `repo`, `workflow`, `gist`, `read:org` | Repository creation, pushes, and Actions secrets are automated |
| `vercel` CLI | v59.5.0, authenticated | Project linking, environment variables, and deploys are automated |
| Supabase MCP server | Added with `account`, `database`, `functions`, `development`, `branching`, `debugging` features | Project creation, migrations, SQL, Edge Function deploys, and type generation are automated once callable |
| Supabase CLI | Not installed at time of writing | Fallback only - `pnpm dlx supabase` requires no install when a `SUPABASE_ACCESS_TOKEN` is exported |
| Node, pnpm, git | v24.18.0, 11.9.0, 2.43.0 | Prerequisites met |
| Firebase, Apple Developer, Expo EAS | No credentials present | Push notification setup remains a manual step |

Three identities exist on this machine - GitHub `ryangsling`, Vercel `jamesahsan1371-6446`, and session email `asiffkhanx007@gmail.com`. Part 2 confirms which account owns the repository and the Vercel project before anything is created.

## Part 1 - Planning and project baseline (hard gate)

**Status:** Complete

### Tasks

- [x] Confirm requirements, technical constraints, and coding standards in root `AGENTS.md`
- [x] Expand this plan with implementation checklists, tests, and success criteria for each phase
- [x] Pause and wait for explicit user approval before starting implementation

### Tests

- [x] Documentation quality check: all phases include actionable tasks, tests, and completion criteria

### Success criteria

- [x] Plan is clear enough to execute phase-by-phase without ambiguity
- [x] User explicitly approves plan before Part 2 starts

## Part 2 - Monorepo and toolchain foundation

**Status:** Complete

### Tasks

- [x] Confirm with the user which GitHub account owns the repository and which Vercel account owns the project
- [x] `git init`, add `.gitignore` covering `node_modules`, `.env*`, `.expo`, `.next`, `dist`, `.turbo`
- [x] Create the repository with `gh repo create` as a private repository, push the existing documentation as the first commit
- [x] Create the `pnpm-workspace.yaml` layout from PRD section 17.3: `apps/mobile`, `apps/web`, `packages/api`, `packages/types`, `packages/validation`, `packages/localization`, `packages/design-tokens`, `packages/ui`, `packages/config`, `supabase/`
- [x] Add Turborepo with `build`, `lint`, `typecheck`, `test` pipelines and correct task dependencies
- [x] Add the shared TypeScript base config, ESLint flat config, and Prettier config in `packages/config`
- [x] Add Vitest at the workspace root with coverage reporting configured for the 80% threshold
- [x] Add a GitHub Actions workflow running lint, typecheck, test, and build on pull requests
- [x] Add an ESLint rule or CI check that fails on raw hex colours and emojis in source files

### Tests

- [x] `pnpm install` succeeds from a clean checkout
- [x] `pnpm turbo run lint typecheck test build` passes with every workspace present
- [x] A deliberately failing placeholder test causes the GitHub Actions run to fail, proving CI is wired - verified via a throwaway PR (#1, closed without merging): CI failed precisely at the Test step with the seeded assertion error and correctly never reached Build
- [x] The emoji and raw-hex checks reject a seeded violation - verified locally against seeded hex and emoji violations in `packages/api`, both rejected with exit 1, then cleaned up

### Success criteria

- [x] Repository exists under the confirmed account with the documentation committed - https://github.com/ryangsling/rescue_alert (private, owned by ryangsling)
- [x] Every workspace package resolves and builds - `pnpm turbo run lint typecheck test build` passes 32/32 tasks
- [x] CI runs green on the first pull request - proven on the throwaway PR once the Node version bug (below) was fixed; the definitive green run is on `main` at commit `c84c058`, since Part 2 has no standalone feature PR of its own

**Bug found and fixed during verification:** the CI workflow pinned Node 20, but `pnpm@11.9.0` requires Node >=22.13 internally (`node:sqlite`). The job failed during `pnpm/action-setup` itself, before any project code ran. Fixed by bumping `node-version` to 22 in `.github/workflows/ci.yml` and correcting `engines.node` in the root `package.json` to `>=22.13`.

### PAUSE 1 - Before Part 3 (Supabase project parameters)
```
PAUSE 1 - Before Part 3 (Supabase project parameters)
The developer must:
1. Verify the Supabase MCP server is usable: run `claude mcp list | grep supabase` and confirm it reads "Connected", not "Pending approval". Tool schemas load when a session starts, so if the server was approved during this session, restart Claude Code before continuing.
2. Confirm the Supabase organization that will own the project at https://supabase.com/dashboard/org
3. Confirm the project name and the region - ap-southeast-1 (Singapore) or ap-south-1 (Mumbai) for Bangladesh latency. The region cannot be changed after creation.
4. Choose and record a database password in a password manager.
5. If the MCP server is not usable, instead: create the project at https://supabase.com/dashboard, generate a token at https://supabase.com/dashboard/account/tokens, and export SUPABASE_ACCESS_TOKEN so `pnpm dlx supabase` can drive migrations.

Confirm to the agent: "Supabase ready"
```

## Part 3 - Database schema, PostGIS, and Row Level Security

**Status:** Pending

### Tasks

- [ ] Create the Supabase project and enable the `postgis` extension
- [ ] Write migrations for the PRD section 18.1 entities, grouped: identity (`profiles`, `user_private_details`, `user_devices`, `notification_preferences`, `volunteer_capabilities`, `user_availability`), cases (`rescue_cases`, `rescue_case_locations`, `rescue_media`, `case_status_history`, `case_responses`, `case_needs`, `case_updates`, `case_comments`, `comment_replies`, `case_watchers`, `rescue_outcomes`), organizations (`organizations`, `organization_members`, `organization_services`, `organization_availability`, `clinics`, `shelters`, `foster_profiles`), reputation (`contributions`, `achievements`, `user_achievements`), and governance (`content_reports`, `moderation_actions`, `account_restrictions`, `audit_logs`)
- [ ] Implement `rescue_cases` with the exact field list in PRD section 18.2, including separate `location` and `approximate_location` geography columns
- [ ] Add enums for incident type, urgency, case status, exceptional states, and closure outcome from PRD sections 8 and 9
- [ ] Add indexes from PRD section 18.4: GiST on active-case geography, GiST on volunteer alert geography, partial index on open cases, indexes on status and creation time, creator and responder relationships, unique index on active device push tokens
- [ ] Write a PostgreSQL function enforcing legal status transitions that writes `case_status_history` atomically, rejecting illegal transitions
- [ ] Write a function deriving `approximate_location` from `location` server-side, never on the client
- [ ] Enable RLS on every table with a deny-by-default policy, then add narrow policies per PRD section 21.1, implementing the confirmed exact-location rule
- [ ] Create a public-safe view exposing only shareable case fields for anonymous access
- [ ] Write `supabase/seed.sql` with Bangladesh administrative areas, incident types, and a small set of test cases and users
- [ ] Generate database types into `packages/types` and wire a script that regenerates them
- [ ] Write Supabase project URL, anon key, and service-role key into local `.env` files and into GitHub Actions secrets with `gh secret set`

### Tests

- [ ] RLS test suite covering all seven roles against every exposed table, asserting both permitted and denied access
- [ ] Anonymous access returns only the public view and never exact coordinates
- [ ] A signed-in non-responder cannot read `location`; an accepted responder can
- [ ] Status transition function rejects every illegal transition and records history for every legal one
- [ ] Geospatial query returns the correct volunteers for a seeded case at known distances
- [ ] Generated types compile against the migrations with no drift

### Success criteria

- [ ] Migrations apply cleanly to an empty database and are reversible
- [ ] Every exposed table has RLS enabled, verified by a query against `pg_tables`
- [ ] Exact coordinates are unreachable by any unauthorized role in tests
- [ ] Type generation is reproducible and committed

## Part 4 - Rescue UI foundation

**Status:** Pending

### Tasks

- [ ] Build `packages/design-tokens` with `colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts`, `motion.ts`, `breakpoints.ts` from DESIGN.md sections 5 to 10
- [ ] Define light and dark themes with separate semantic containers, not mechanical inversion
- [ ] Configure NativeWind and Tailwind to consume the tokens so both apps share one source of truth
- [ ] Bundle Inter and Noto Sans Bengali with the mobile app; do not fetch fonts at runtime
- [ ] Build primitives in `packages/ui`: text, stack, surface, divider, safe-area container
- [ ] Build button variants from DESIGN.md section 11.2 - primary, secondary, tonal, outline, text, destructive, icon, floating report action - with 48px minimum height and width-preserving loading states
- [ ] Build form controls from DESIGN.md section 11.3, each with label, help text, error text, focus, disabled, and loading states
- [ ] Build sheet, dialog, menu, toast, and banner including the offline banner
- [ ] Set up the Lucide icon package in `packages/icons`

### Tests

- [ ] Every component renders in light and dark themes
- [ ] Contrast assertions: normal text meets 4.5:1, large text and meaningful boundaries meet 3:1
- [ ] Touch targets measure at least 44 by 44 pixels
- [ ] Components render correctly at 200% font scaling without clipping
- [ ] Keyboard navigation and focus trapping work on web; focus ring is always visible
- [ ] Accessibility labels are present on every icon button

### Success criteria

- [ ] No feature code references a raw hex value or pixel literal
- [ ] Tokens resolve identically in Expo and Next.js
- [ ] Every foundation component satisfies the DESIGN.md section 19 quality checklist

## Part 5 - Rescue-specific components

**Status:** Pending

### Tasks

- [ ] Status chip carrying semantic background, icon, and text together - the signature element, used identically everywhere urgency appears
- [ ] Segmented urgency selector for the four levels in PRD section 8.2
- [ ] Rescue case card with all eight required elements from DESIGN.md section 11.5, in compact, detailed, map preview, activity, and closed outcome variants
- [ ] Case header per DESIGN.md section 11.6 with a persistent primary action that does not obscure content
- [ ] Official update component with left semantic accent, actor identity and role, timestamp, and update type, visually distinct from comments
- [ ] Responder card per DESIGN.md section 11.8, hiding phone numbers and locations without authorization
- [ ] Safety callout in critical, warning, information, and positive variants
- [ ] Location field and static map preview
- [ ] Media picker with upload, retry, and failure states
- [ ] Needs selector and outcome selector
- [ ] Offline draft indicator distinguishing pending local state from confirmed server state
- [ ] Graphic media cover that blurs by default and requires an explicit reveal
- [ ] Empty, loading, offline, permission-denied, partial failure, and full error states as reusable components

### Tests

- [ ] Status is never conveyed by colour alone - each chip asserts presence of icon and text
- [ ] Graphic media stays covered until explicitly revealed, verified by interaction test
- [ ] Responder card omits phone number for an unauthorized viewer
- [ ] Case card renders correctly with বাংলা, English, and mixed-language content at long label lengths
- [ ] Draft indicator distinguishes pending from confirmed states

### Success criteria

- [ ] All 18 components in DESIGN.md section 20 exist with tests
- [ ] Every component passes the section 19 quality checklist
- [ ] No component displays likes, popularity, or report counts

## Part 6 - Localization

**Status:** Pending

### Tasks

- [ ] Build `packages/localization` with বাংলা and English catalogues and a typed key accessor
- [ ] Use complete localized sentences with interpolation; never concatenate translated fragments
- [ ] Implement in-app language switching without reinstall, persisted per user
- [ ] Format dates, times, and numbers per Bangladesh conventions for the selected language
- [ ] Keep phone normalization separate from display formatting
- [ ] Store canonical administrative identifiers separately from translated labels
- [ ] Add a CI check failing when a key exists in one catalogue but not the other
- [ ] Ensure system notifications and statuses resolve in the recipient's preferred language

### Tests

- [ ] Every key exists in both catalogues, asserted mechanically
- [ ] Language switch re-renders without restart and persists across sessions
- [ ] User-generated content retains its original language regardless of interface language
- [ ] Bengali conjuncts and vowel marks render without clipping at the defined line heights

### Success criteria

- [ ] Every core workflow is fully usable in both languages
- [ ] No concatenated translation fragments exist in the codebase
- [ ] The catalogue parity check is enforced in CI

## Part 7 - Authentication and onboarding

**Status:** Pending

### Tasks

- [ ] Registration with full name, email, Bangladesh phone, city and area, password and confirmation, normalizing phone to `+8801XXXXXXXXX`
- [ ] Terms, privacy notice, location policy, and community rules acceptance recorded with timestamp
- [ ] Email verification using Supabase built-in SMTP, with deep links resolving on both apps
- [ ] Sign in with email and password
- [ ] Password recovery that never reveals whether an email belongs to an account
- [ ] Sign out of current device and of all devices
- [ ] Account deletion request flow
- [ ] Recent-authentication requirement for sensitive account changes
- [ ] Suspended accounts blocked from creating, responding, and commenting, enforced in RLS not only in the interface
- [ ] Onboarding: language choice first, capability selection from PRD section 7.1 item 5, preferred animal types, alert radius
- [ ] Permission priming screens - explain nearby alerts before requesting notifications, explain foreground location before requesting it, never request camera during registration
- [ ] Rate limits on registration and sign-in

### Tests

- [ ] Registration rejects malformed Bangladesh phone numbers and stores the normalized form
- [ ] Sign-in and recovery responses are identical for existing and non-existing accounts
- [ ] Suspended user is blocked at the database level, verified without going through the UI
- [ ] Sign out of all devices invalidates every session
- [ ] Onboarding can be skipped and resumed later
- [ ] Denying notification or location permission leaves unrelated features usable
- [ ] E2E: register, verify, sign in, recover password, delete account, on both apps

### Success criteria

- [ ] PRD acceptance criterion 1 is demonstrably satisfied
- [ ] No user enumeration is possible through any auth endpoint
- [ ] Permission requests never appear before their explanatory screen

## Part 8 - Rescue case creation

**Status:** Pending

### Tasks

- [ ] Report flow following the seven steps in DESIGN.md section 14.3, saving locally after every step
- [ ] Local draft persistence - Expo SQLite on mobile, IndexedDB on web
- [ ] Incident type and urgency selection from PRD section 8, with the notice that urgency is community-reported and not a veterinary assessment
- [ ] Animal type and visible condition selection
- [ ] Location capture by GPS, movable map pin, or manual area selection, with manual entry always available when permission is denied
- [ ] Landmark entry accepting বাংলা and English
- [ ] Media capture and selection with client-side compression and EXIF GPS stripping before upload
- [ ] File type detection by content inspection, not filename extension
- [ ] Signed upload paths tied to the authenticated user
- [ ] Idempotency key generated per draft so retries never create duplicate cases
- [ ] Nearby duplicate detection warning before submission
- [ ] Preview screen showing exactly what becomes public before confirming
- [ ] Post-submission editing of factual fields, preserving a change history

### Tests

- [ ] EXIF GPS data is absent from every public derivative, asserted on a fixture image containing coordinates
- [ ] Submitting the same idempotency key twice creates exactly one case
- [ ] A report survives app termination mid-flow and resumes with all entered data
- [ ] Upload failure preserves the draft and surfaces a recovery action
- [ ] Duplicate warning triggers for a case seeded nearby within the time window
- [ ] The client never claims success before server confirmation
- [ ] E2E: create a complete case with GPS and with manual location, on both apps

### Success criteria

- [ ] PRD acceptance criteria 2 and 3 are demonstrably satisfied
- [ ] No report is lost by network interruption in testing
- [ ] Public media carries no location metadata

## Part 9 - Maps and location

**Status:** Pending

### Tasks

- [ ] Integrate MapLibre React Native on mobile and MapLibre GL JS on web with the OpenFreeMap style, which requires no API key
- [ ] Put tile, geocoding, and routing providers behind a configuration interface that can be changed remotely
- [ ] Render the four location privacy states from DESIGN.md section 12.2 - exact, approximate, hidden, expired
- [ ] Implement the seven marker types from DESIGN.md section 12.1, each with an outline so it stays visible over varied map colours
- [ ] Show straight-line distance with an approximation label; no routing ETA
- [ ] Open coordinates in an installed map application
- [ ] Keep OpenStreetMap attribution permanently visible
- [ ] Cache user-triggered geocoding results and respect Nominatim usage policy
- [ ] Provide an equivalent text and list representation of all map information
- [ ] Defer map loading until the user opens map mode
- [ ] Confirm the attribution wording with the user

### Tests

- [ ] An unauthorized viewer sees the approximate marker and never the exact coordinate, asserted at the network layer
- [ ] Markers remain distinguishable under simulated deuteranopia and protanopia
- [ ] Attribution is present in every map view
- [ ] External navigation hand-off opens with correct coordinates on Android, iOS, and web
- [ ] The list representation conveys the same information as the map for a screen reader

### Success criteria

- [ ] PRD acceptance criterion 14 is demonstrably satisfied
- [ ] Switching tile provider requires configuration only, no code change
- [ ] The nearby list is fully usable without ever loading a map

## Part 10 - Feed, search, and discovery

**Status:** Pending

### Tasks

- [ ] List view as the default discovery surface, map view secondary
- [ ] Ranking by urgency, suitability to the viewer's capabilities, distance, and freshness - never by popularity
- [ ] Apply the five-tier priority order from DESIGN.md section 14.2
- [ ] Filters for animal, status, incident type, distance, date, and required help
- [ ] Closed cases discoverable separately from active cases
- [ ] Text search supporting বাংলা and English
- [ ] Pagination on every feed
- [ ] Thumbnails in lists, never full images
- [ ] Bounded realtime subscriptions that unsubscribe on unmount

### Tests

- [ ] Ranking places a matching critical case above a nearer non-matching support case
- [ ] Filters compose correctly and produce the expected result sets against seed data
- [ ] Bengali and English search both return the seeded case
- [ ] Feeds paginate and do not load unbounded result sets
- [ ] No realtime subscription leaks across navigation, asserted by connection count

### Success criteria

- [ ] The nearby list becomes usable quickly on a throttled connection
- [ ] No popularity signal appears anywhere in the feed
- [ ] Closed and active cases never intermix

### PAUSE 2 - Before Part 11 (Push notification credentials)
```
PAUSE 2 - Before Part 11 (Push notification credentials)
The developer must:
1. Create a Firebase project at https://console.firebase.google.com, add an Android app with the production package name, and download google-services.json into apps/mobile/
2. Enrol in the Apple Developer Program and create an APNs authentication key at https://developer.apple.com/account/resources/authkeys/list, downloading the .p8 file
3. Create an Expo account and run `eas login`, then `eas init` inside apps/mobile to generate the EAS project ID
4. Upload both credentials with `eas credentials`, selecting Android FCM V1 and iOS APNs key
5. Record the EAS project ID in apps/mobile/app.config.ts

Confirm to the agent: "Push credentials ready"
```

## Part 11 - Geospatial matching and push notifications

**Status:** Pending

### Tasks

- [ ] PostGIS candidate query selecting volunteers by alert radius, availability, capability, preferred animal types, quiet hours, account trust status, and existing commitments - never scanning all users
- [ ] Edge Function dispatching notifications through Expo Notifications, running as a background task
- [ ] Device token registration, refresh, and removal of invalid or expired tokens
- [ ] Radius expansion for critical cases from a small initial radius to larger configured radii when no response arrives within the configured interval
- [ ] Stop conditions - expansion halts when adequate assistance is committed or the case closes
- [ ] Deduplication ensuring a volunteer never receives a repeated initial alert for the same case
- [ ] Quiet hours honoured, overridden only for users who explicitly enabled critical-alert override
- [ ] Notification payloads carrying case type, approximate area, and distance, never exact coordinates or private contact details
- [ ] Deep links resolving to the correct case from a cold application start
- [ ] Notification grouping for repeated updates on one case
- [ ] Delivery attempts recorded without treating delivery as proof of being seen
- [ ] Notification failure isolated so it never rolls back a successfully created case
- [ ] Remaining nine notification categories from PRD section 11.1

### Tests

- [ ] Matching returns exactly the expected volunteers for seeded cases at known distances and preference combinations
- [ ] Running the dispatcher twice for one case sends no duplicate initial alerts
- [ ] Radius expansion stops on commitment and on closure, asserted separately
- [ ] Quiet hours suppress non-override notifications and permit override ones
- [ ] Invalid tokens are removed after a rejected send
- [ ] Notification payload contains no exact coordinate and no phone number
- [ ] Deep link opens the correct case from a cold start on both platforms
- [ ] A forced notification failure leaves the created case intact

### Success criteria

- [ ] PRD acceptance criteria 4 and 16 are demonstrably satisfied
- [ ] Matching is executed in PostGIS, verified by query plan inspection
- [ ] No duplicate alert is observed across the full test suite

## Part 12 - Response, assignment, and coordination

**Status:** Pending

### Tasks

- [ ] "I can help" action on an open case, with selection of one or more assistance types
- [ ] Estimated arrival or availability time
- [ ] Withdrawal with a required reason
- [ ] Multiple responders per case with distinct responsibilities, without overwriting one another
- [ ] Needs board showing what remains unfilled
- [ ] Coordinator controls marking assistance confirmed, completed, declined, or unresponsive
- [ ] Explicit statement that accepting a case does not imply legal ownership of the animal
- [ ] Comments with replies and participant mentions
- [ ] Official updates from authorized participants, visually distinct from comments
- [ ] Pinned critical instructions from a coordinator
- [ ] Media attachments on updates
- [ ] Privacy warning before posting text containing personal contact information
- [ ] Reporting of comments and media
- [ ] Editing and deletion preserving moderation evidence
- [ ] Realtime updates to the case detail screen with bounded subscriptions
- [ ] Sensitive contact information shared only with authorized participants

### Tests

- [ ] Two responders committing concurrently both persist, with no lost update
- [ ] Withdrawal requires a reason and updates the needs board
- [ ] An unauthorized user cannot post an official update, enforced at the database level
- [ ] Contact information in comment text triggers the privacy warning
- [ ] Case closed while a responder is viewing it resolves cleanly with no stale action
- [ ] E2E: two volunteers coordinate one case end to end

### Success criteria

- [ ] PRD acceptance criteria 5, 6, and 7 are demonstrably satisfied
- [ ] Official updates are unmistakably distinct from comments
- [ ] No coordination action silently overwrites another

## Part 13 - Case closure, outcomes, and rescue history

**Status:** Pending

### Tasks

- [ ] Structured closure sheet following DESIGN.md section 14.5 - outcome, final update, optional media, contribution confirmation, follow-up need, and a review of what becomes public
- [ ] All fourteen closure outcomes from PRD section 9.3
- [ ] Required final update for normal closure
- [ ] Notifications and radius expansion stop on closure
- [ ] Contribution crediting limited to selected categories, verified per PRD section 13.2
- [ ] Moderator reopening of an incorrectly closed case
- [ ] Linked follow-up cases for foster, treatment, or adoption needs
- [ ] Rescue history on public profiles after privacy review, showing verified contributions without sensitive data
- [ ] No confetti, no celebration during an unresolved rescue

### Tests

- [ ] Closure without an outcome or final update is rejected
- [ ] Notifications provably stop after closure
- [ ] Contributions appear only after verification by an authorized confirmer
- [ ] Reopening restores the case and preserves the full audit trail
- [ ] Rescue history exposes no exact location or private contact detail
- [ ] E2E: close a case with each of several outcomes and confirm the audit record

### Success criteria

- [ ] PRD acceptance criterion 8 is demonstrably satisfied
- [ ] Every status change records actor, timestamp, previous status, new status, and reason
- [ ] No gamified celebration exists anywhere in the closure flow

## Part 14 - Organizations, clinics, and directory

**Status:** Pending

### Tasks

- [ ] Organization verification request and manual administrator approval
- [ ] Organization profile with services, service area, hours, contact method, and availability
- [ ] Explicit opt-in to alert categories - no automatic dispatch to organizations that have not opted in
- [ ] Named organization member accounts; shared credentials prohibited
- [ ] Organization administrator managing members, availability, and alert preferences
- [ ] Role restriction on sensitive organization and foster capacity information
- [ ] Last-confirmed date on every directory record
- [ ] Public directory of verified organizations, clinics, and shelters
- [ ] Foster profiles with capacity, species, area, dates, and limitations, receiving suitable requests rather than all emergency alerts
- [ ] Foster addresses never published

### Tests

- [ ] An unverified organization cannot receive dispatch or appear in the directory
- [ ] Alert categories not opted into produce no notifications, asserted against the dispatcher
- [ ] Foster address is unreachable by every role except the placement-approved participant
- [ ] Verification badge names the verifying authority and scope
- [ ] Directory record without a recent last-confirmed date is flagged

### Success criteria

- [ ] Organizations control exactly what they receive
- [ ] No foster address appears in any API response
- [ ] Verification is manual and audited

## Part 15 - Moderation and administration dashboard

**Status:** Pending

### Tasks

- [ ] Web dashboard with the eleven capabilities in PRD section 24
- [ ] Active critical-case queue and unanswered-critical monitoring
- [ ] Reported content queue covering cases, comments, profiles, and media, with the nine report reasons from PRD section 10.13
- [ ] Hide content pending review
- [ ] Merge duplicate cases while preserving references
- [ ] Redact personal information and sensitive locations
- [ ] Warn, restrict, suspend, and ban accounts
- [ ] Appeals recorded and reviewable by a different moderator where possible
- [ ] Case status correction preserving the audit trail
- [ ] Audit log viewer covering every moderation action
- [ ] Configurable incident types, alert radii, and notification rules
- [ ] বাংলা and English system content management
- [ ] Destructive actions requiring confirmation and a stated reason
- [ ] Graphic images blurred by default in the queue
- [ ] Abuse cases involving identifiable people restricting sensitive location and identity information
- [ ] Keyboard accessibility across all dense tables

### Tests

- [ ] Every moderation action writes an audit record with actor, target, action, reason, and timestamp
- [ ] A non-moderator cannot reach any moderation endpoint, enforced at the database level
- [ ] Merging duplicates preserves references from both cases
- [ ] Destructive actions cannot proceed without a reason
- [ ] The entire dashboard is operable by keyboard alone
- [ ] E2E: report content, review it, act on it, and verify the audit entry

### Success criteria

- [ ] PRD acceptance criterion 10 is demonstrably satisfied
- [ ] No moderation action is possible without an audit record
- [ ] Appeals reach a different moderator where staffing allows

## Part 16 - Public share pages

**Status:** Pending

### Tasks

- [ ] Public case page carrying exactly the seven elements in PRD section 25 and nothing more
- [ ] Social preview metadata generating useful cards for Facebook and Messenger
- [ ] Public rescue history and open-case listing
- [ ] Public safety and education pages
- [ ] Public organization directory
- [ ] Server-side rendering for crawlable public pages
- [ ] Sign-in prompt to respond, deep-linking into the app when installed
- [ ] Exclusion of exact coordinates, personal contact information, and unapproved media from every public surface

### Tests

- [ ] Public page response body contains no exact coordinate, phone number, or email, asserted against the raw payload
- [ ] Social preview renders correctly in a card validator
- [ ] A sensitive case exposes area-level information only
- [ ] Anonymous access reaches only the public-safe view

### Success criteria

- [ ] PRD acceptance criteria 9 and 11 are demonstrably satisfied
- [ ] Sharing a case to a social network leaks nothing sensitive

## Part 17 - Safety, disclaimers, and accessibility

**Status:** Pending

### Tasks

- [ ] Bite and rabies warnings shown contextually where relevant
- [ ] Guidance not to approach aggressive, disoriented, or potentially rabid animals without trained assistance
- [ ] First-aid guidance for human bites and scratches, always directing to professional medical care
- [ ] Hazard flags for traffic, violence, electrical, water, and height risks
- [ ] Safety callouts placed in the report flow, case detail, and response flow - never hidden in settings
- [ ] The four disclaimers from PRD section 12.5 placed in the flows where they matter
- [ ] Guidance against relocating healthy community animals without lawful and welfare-based justification
- [ ] No instructions that encourage untrained users to administer medication
- [ ] Full WCAG 2.2 AA pass against the DESIGN.md section 15 checklist
- [ ] Screen reader announcement of case status changes and form errors
- [ ] Reduced motion support and font scaling with reflow
- [ ] Bengali typography verification across all screens

### Tests

- [ ] Automated accessibility scan passes on every major screen on both apps
- [ ] Manual testing with TalkBack, VoiceOver, keyboard-only web navigation, and browser zoom
- [ ] Status changes are announced by screen readers
- [ ] All screens render correctly at 200% scaling in both languages
- [ ] Safety content appears in the required flows, asserted by test

### Success criteria

- [ ] PRD acceptance criterion 15 is demonstrably satisfied
- [ ] No accessibility violation of severity serious or above remains
- [ ] Safety guidance is reachable without entering settings

## Part 18 - Offline, reliability, and performance hardening

**Status:** Pending

### Tasks

- [ ] Draft persistence and recovery verified across app termination, crash, and reinstall-free reboot
- [ ] Retry queue for failed uploads and submissions with visible synchronization state
- [ ] Idempotency applied to every retryable write
- [ ] Recently viewed case summaries cached
- [ ] Transactional status transitions
- [ ] Clear distinction between pending local state and confirmed server state throughout the interface
- [ ] Error messages following the three-part pattern in DESIGN.md section 17.3 - what happened, whether data is safe, what to do next
- [ ] Performance work: thumbnails in lists, deferred map loading, indexed geospatial queries, bounded realtime subscriptions
- [ ] Low-memory Android device testing
- [ ] Throttled-network testing of the core reporting and response paths

### Tests

- [ ] Airplane-mode report creation queues and syncs correctly on reconnection
- [ ] Repeated retries produce exactly one case, one response, and one notification
- [ ] No interface state claims success before server confirmation, asserted across all mutations
- [ ] Core flows complete on a simulated slow connection within acceptable time
- [ ] The app functions on a low-memory Android device profile

### Success criteria

- [ ] PRD acceptance criterion 3 holds under adversarial network conditions
- [ ] No silent data loss is observed in any offline test
- [ ] Every error message states what happened, whether data is safe, and what to do next

## Part 19 - Test suite completion

**Status:** Pending

### Tasks

- [ ] Complete RLS test coverage for every role against every exposed table
- [ ] Complete status transition coverage including every illegal transition
- [ ] Geospatial matching test suite across radius, capability, availability, and quiet-hour permutations
- [ ] Notification deduplication and radius-stop test suite
- [ ] Offline retry and idempotency test suite
- [ ] Playwright E2E for public pages, authenticated web workflows, and moderator flows
- [ ] Maestro E2E for mobile reporting and response
- [ ] Raise unit coverage to at least 80% with emphasis on domain rules and authorization
- [ ] Wire the full suite into GitHub Actions with coverage reporting

### Tests

- [ ] The complete suite runs green in CI from a clean checkout
- [ ] Coverage report meets the 80% threshold and fails the build below it
- [ ] Every PRD section 27.1 automated testing category has a corresponding suite

### Success criteria

- [ ] PRD acceptance criterion 13 is demonstrably satisfied
- [ ] No test is skipped or marked pending
- [ ] CI runtime stays workable for routine development

### PAUSE 3 - Before Part 20 (Store accounts and production email)
```
PAUSE 3 - Before Part 20 (Store accounts and production email)
The developer must:
1. Create a Google Play developer account at https://play.google.com/console/signup - one-time fee of USD 25 - and create the app entry for an internal testing track
2. Confirm the Apple Developer Program enrolment from PAUSE 2 is active - USD 99 per year - and create the App Store Connect entry for TestFlight
3. Decide whether the pilot stays on Supabase built-in email. If not, configure a custom SMTP provider and verify the sender domain in the Supabase dashboard under Authentication, Emails, SMTP Settings
4. Confirm the production domain for the web application, if one is being used, so it can be added in the Vercel project settings
5. Confirm which Supabase backup schedule is acceptable for the pilot

Confirm to the agent: "Deployment accounts ready"
```

## Part 20 - Deployment and MVP acceptance

**Status:** Pending

### Tasks

- [ ] Link the Vercel project with `vercel link` and set environment variables with `vercel env add` for preview and production
- [ ] Deploy the web application to production and verify public pages render server-side
- [ ] Configure EAS build profiles for development, preview, and production
- [ ] Produce Android and iOS builds and submit to internal testing tracks
- [ ] Configure Supabase scheduled backups of schema and essential data
- [ ] Verify quota monitoring on Supabase and Vercel free tiers
- [ ] Write `docs/database-design.md`, `docs/privacy-model.md`, `docs/moderation-policy.md`, and `docs/incident-response.md`
- [ ] Write the pilot operations playbook and the বাংলা terminology guide
- [ ] Set up the operational dashboard monitoring the seven signals in PRD section 23
- [ ] Wire the privacy-conscious analytics events listed in PRD section 23
- [ ] Walk through all seventeen MVP acceptance criteria in PRD section 28 and record evidence for each

### Tests

- [ ] Production deployment serves public pages correctly with valid social previews
- [ ] Mobile builds install and run on real Android and iOS devices
- [ ] A restore from backup succeeds in a scratch project
- [ ] Every one of the seventeen acceptance criteria has recorded passing evidence
- [ ] Staged supervised rescue simulation completes end to end without a real animal emergency being fabricated

### Success criteria

- [ ] All seventeen PRD section 28 acceptance criteria pass with evidence
- [ ] Documented incident, moderation, and data-recovery procedures exist
- [ ] The system is ready for a closed pilot in the selected Dhaka area

### PAUSE Block Format 
copy-paste this pattern whenever a part needs a manual step:
```
PAUSE N - [Before/After] Part X ([Short label])
The developer must:
1. [Exact action with URL or file path]
2. [Exact action]
3. [Exact action]

Confirm to the agent: "[Short confirmation phrase]"
```
