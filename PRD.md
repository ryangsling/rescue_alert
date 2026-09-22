# Product Requirements Document: Rescue Alert

**Working title:** Rescue Alert / RescueBD  
**Document version:** 1.0  
**Status:** Draft for product validation  
**Primary market:** Bangladesh  
**Platforms:** Android, iOS, and web  
**Primary language:** বাংলা and English  
**Product type:** Community animal rescue coordination platform

---

## 1. Executive summary

Rescue Alert is a location-aware community platform for reporting, coordinating, and documenting the rescue of stray and community animals in Bangladesh.

A registered user can report an injured, endangered, abandoned, trapped, or shelter-seeking animal by providing photos, a description, urgency information, and a GPS or manually selected location. Suitable volunteers near the case receive alerts based on distance, availability, capabilities, and notification preferences. Volunteers can respond to the case, coordinate through updates and comments, navigate to the location, provide transport or treatment, arrange foster care, and record the final outcome.

The product is not intended to be a general-purpose social network. Its primary purpose is to turn fragmented animal-rescue posts into structured, location-aware rescue operations with clear status, accountability, safety controls, and measurable outcomes.

The initial version will use a free-first, open-source-oriented architecture and avoid services that create recurring operational dependencies during the community pilot.

---

## 2. Background and context

Animal rescues in Bangladesh are commonly coordinated through Facebook groups, Messenger, WhatsApp, phone calls, and personal networks. These channels are useful for distribution but make operational coordination difficult:

- Reports are unstructured and may omit location, urgency, or current status.
- Nearby volunteers are not automatically identified.
- Multiple people may respond without knowing about one another.
- Cases can remain visible after being resolved, creating confusion.
- Important updates become buried in comment threads.
- There is no consistent rescue history or outcome record.
- Clinics, transport volunteers, foster homes, and organizations are difficult to match with cases.
- Fraudulent, duplicate, or unsafe reports are difficult to moderate.

Bangladesh’s Animal Welfare Act, 2019 provides the relevant animal-welfare context. The product should support humane rescue, treatment, vaccination, sterilization, rehabilitation, safe return where appropriate, fostering, and adoption. It must not encourage indiscriminate removal of healthy community animals from their habitats.

Rabies and bite safety are also significant public-health considerations. Rescue Alert must include safety guidance and avoid presenting volunteer action as a replacement for professional veterinary or emergency care.

---

## 3. Product vision

> Make animal rescue in Bangladesh faster, safer, more coordinated, and more transparent by connecting verified information with capable people near the animal.

### 3.1 Product principles

1. **Rescue coordination before social engagement** — optimize for action and outcomes, not likes or follower counts.
2. **Fast reporting under pressure** — a valid emergency alert should be creatable in approximately two minutes.
3. **Location-aware, privacy-conscious response** — use proximity without unnecessarily exposing precise locations.
4. **Safety over gamification** — never reward risky behavior or raw report volume.
5. **Low-bandwidth by default** — the core workflow must remain usable on slow or unreliable connections.
6. **বাংলা and English from the beginning** — localization is a core requirement, not a later add-on.
7. **Human judgment remains authoritative** — AI may assist but must not diagnose or close a case.
8. **Community trust is earned** — verification, moderation, auditability, and transparent outcomes are fundamental.
9. **Open and replaceable infrastructure** — avoid unnecessary dependence on proprietary services.
10. **Organizations opt in** — clinics, shelters, and NGOs must control what alerts they receive.

---

## 4. Goals and success criteria

### 4.1 Product goals

- Make it easy to create a complete, actionable animal rescue alert.
- Notify relevant nearby volunteers without excessive notification spam.
- Show whether a case has responders and what help is still required.
- Provide structured coordination from report through resolution.
- Preserve verified rescue outcomes and volunteer contributions.
- Support trusted organizations, clinics, foster homes, and community coordinators.
- Provide a public web page that can be shared through existing social networks.
- Operate as a controlled community pilot without requiring paid infrastructure dependencies.

### 4.2 Pilot success indicators

The pilot should measure:

- Percentage of valid reports receiving a responder.
- Median time from report creation to first accepted response.
- Percentage of cases with a recorded outcome.
- Percentage of resolved cases marked successful.
- Duplicate-report rate.
- False, abusive, or spam-report rate.
- Notification open and response rates.
- Percentage of responders who arrive or provide the promised assistance.
- Average number of coordination updates per active case.
- Volunteer retention after the first completed rescue.
- বাংলা versus English usage.
- Failed upload and offline-sync rates.
- Moderator response time for high-risk reports.

Targets should be established after the first field pilot, not invented before baseline data exists.

### 4.3 Non-goals for the MVP

The MVP will not include:

- Veterinary diagnosis by AI.
- A complete animal-adoption marketplace.
- Donation or payment processing.
- Continuous background tracking of all users.
- Built-in turn-by-turn navigation.
- Video livestreaming.
- A public popularity leaderboard.
- Automatic dispatch to organizations that have not opted in.
- A custom SMS infrastructure.
- A general-purpose social feed.
- Guaranteed emergency response.

---

## 5. Target users and personas

### 5.1 Reporter

A person who sees an animal requiring help. The reporter may be an experienced volunteer or a first-time community member.

**Needs:**

- Report quickly.
- Describe the animal’s condition.
- Provide an accurate location or landmark.
- Know whether someone is responding.
- Share the alert outside the app.

### 5.2 Rescue volunteer

A person able to approach, contain, transport, or coordinate treatment for an animal.

**Needs:**

- Receive relevant nearby alerts.
- Understand urgency before responding.
- Navigate to the animal.
- Coordinate with other responders.
- Avoid duplicate or unsafe actions.
- Record contributions and outcomes.

### 5.3 Transport volunteer

A person who can move an animal to a clinic, foster home, or shelter.

**Needs:**

- See pickup and destination information.
- Know animal size, condition, and handling requirements.
- Share an estimated arrival time.
- Protect private destination addresses.

### 5.4 Foster or shelter provider

A person or organization offering temporary accommodation.

**Needs:**

- Specify capacity, species, area, dates, and limitations.
- Receive suitable requests rather than all emergency alerts.
- Keep exact addresses private until a placement is approved.

### 5.5 Veterinary clinic or animal-welfare organization

A verified entity that may provide treatment, rescue, ambulance, rehabilitation, vaccination, sterilization, or shelter support.

**Needs:**

- Maintain verified service information.
- Control availability and alert categories.
- Assign staff or organization volunteers.
- Record accepted transfers and outcomes.

### 5.6 Moderator

A trusted community member responsible for report quality and user safety.

**Needs:**

- Review abuse, fraud, duplicate, graphic, or inaccurate content.
- Restrict unsafe accounts.
- Merge duplicates.
- Correct statuses while preserving an audit trail.
- Protect sensitive locations and personal information.

### 5.7 Administrator

A system operator responsible for roles, policies, configuration, and platform health.

---

## 6. User roles and permissions

| Role | Primary permissions |
|---|---|
| Guest | View limited public case pages and safety information |
| Registered user | Create reports, comment, respond, manage profile and notification preferences |
| Trusted volunteer | Access additional coordination features and apply for sensitive cases |
| Organization member | Act on behalf of a verified organization |
| Organization administrator | Manage organization profile, members, availability, and alert preferences |
| Moderator | Review reports, hide content, merge cases, restrict accounts, adjust statuses |
| Administrator | Manage roles, configuration, moderation policies, and system-level operations |

Authorization must be enforced at the database and server-function level, not only in the interface.

---

## 7. Primary user journeys

### 7.1 Registration and onboarding

1. User selects বাংলা or English.
2. User enters full name, email, Bangladesh phone number, city/area, password, and confirmation.
3. User accepts the terms, privacy notice, location policy, and community rules.
4. Email verification is completed.
5. User selects optional capabilities:
   - On-site rescue
   - Transport
   - Veterinary professional or assistant
   - Temporary foster
   - Shelter coordination
   - Adoption support
   - Case coordination
   - Financial support interest
6. User selects preferred animal types and alert radius.
7. The application explains notifications before requesting permission.
8. Camera, gallery, and location permissions are requested only when the related feature is used.

### 7.2 Create a rescue case

1. User taps **Report an animal**.
2. User selects the incident type and urgency.
3. User captures or selects at least one image, unless a moderator-approved exception applies.
4. User selects the animal type and visible condition.
5. User uses GPS, adjusts a map pin, or manually chooses the location.
6. User adds a landmark and description.
7. User indicates whether they are still at the location.
8. User previews the alert and confirms the information.
9. The system creates the case and begins volunteer matching.
10. The reporter sees the case status and can post official updates.

### 7.3 Respond to a case

1. Volunteer receives a nearby alert or discovers the case in the feed.
2. Volunteer reviews urgency, distance, safety information, required help, and current responders.
3. Volunteer selects **I can help**.
4. Volunteer chooses one or more contribution types.
5. Volunteer provides an estimated arrival or availability time.
6. The case shows the commitment to authorized participants.
7. Volunteer opens the destination in an installed map application.
8. Volunteer posts progress updates or withdraws with a reason.

### 7.4 Coordinate a rescue

1. Participants post official updates and comments.
2. A coordinator may pin critical instructions.
3. Responders indicate whether the animal has been located.
4. Participants update transport, treatment, foster, or shelter needs.
5. Sensitive contact information is shared only with authorized participants.
6. The status timeline records meaningful transitions.

### 7.5 Close a case

1. Reporter, coordinator, authorized organization member, or moderator selects **Close case**.
2. User selects an outcome.
3. User provides a final update.
4. User may upload supporting evidence.
5. Participants are associated with verified contributions.
6. Notifications and radius expansion stop.
7. Follow-up needs may create a linked foster, treatment, or adoption case.

---

## 8. Case types and urgency

### 8.1 Incident types

- Injured animal
- Road accident
- Critically ill animal
- Trapped animal
- Abandoned animal
- Abuse or cruelty suspected
- Mother with babies
- Orphaned babies
- Animal creating immediate traffic risk
- Temporary foster needed
- Shelter needed
- Transport needed
- Veterinary treatment needed
- Lost animal found
- Adoption needed
- Other animal-welfare concern

### 8.2 Urgency levels

| Level | Meaning | Example behavior |
|---|---|---|
| Critical | Immediate risk of death, severe injury, active traffic danger, or abuse | Fastest nearby alert escalation |
| Urgent | Prompt assistance is needed but the animal appears temporarily stable | Normal nearby volunteer matching |
| Support needed | Foster, transport, supplies, follow-up treatment, or coordination | Wider but lower-priority distribution |
| Adoption/community | No immediate rescue emergency | Feed and search discovery; no emergency notification |

The interface must state that urgency is community-reported and not a professional medical assessment.

---

## 9. Case state model

### 9.1 Primary states

```text
Draft
→ Submitted
→ Under review (when risk checks require it)
→ Open
→ Response committed
→ Responder en route
→ Animal located
→ Rescue in progress
→ Transporting
→ At clinic / foster / shelter
→ Follow-up required
→ Resolved
→ Closed
```

### 9.2 Exceptional states

- No longer found
- Duplicate
- False report
- Spam
- Unsafe or prohibited content
- Cancelled by reporter
- Closed by moderator

### 9.3 Closure outcomes

- Successfully rescued
- Treated and returned safely
- Transferred to veterinary care
- Transferred to an animal-welfare organization
- Moved to temporary foster care
- Moved to shelter
- Adopted
- Animal recovered without intervention
- Animal could not be found
- Duplicate report
- Report determined inaccurate
- Animal died before help arrived
- Animal died during or after treatment
- Other documented outcome

Every status change must record actor, timestamp, previous status, new status, and optional reason.

---

## 10. Functional requirements

### 10.1 Authentication and account management

- **AUTH-001:** Users must be able to register with full name, email, Bangladesh phone number, city/area, password, and password confirmation.
- **AUTH-002:** Phone numbers must be stored in normalized `+8801XXXXXXXXX` format.
- **AUTH-003:** Users must be able to sign in with email and password.
- **AUTH-004:** Users may sign in with phone number and password when that identifier is enabled for the account.
- **AUTH-005:** Password recovery must use the verified email address during the free-first pilot.
- **AUTH-006:** The system must not reveal whether a submitted email or phone belongs to an account.
- **AUTH-007:** Users must be able to sign out of the current device and all devices.
- **AUTH-008:** Users must be able to request account deletion.
- **AUTH-009:** Suspended users must be prevented from creating, responding to, or commenting on cases.
- **AUTH-010:** Sensitive account changes must require recent authentication.

### 10.2 Profiles and capabilities

- **PROF-001:** Users must be able to edit their name, city, area, preferred language, biography, and profile photo.
- **PROF-002:** Users must be able to select volunteer capabilities.
- **PROF-003:** Users must be able to set availability without exposing live location.
- **PROF-004:** Users must be able to select animal types they can assist.
- **PROF-005:** Phone numbers must be private by default.
- **PROF-006:** Public profiles may show verified contributions and rescue history but not sensitive personal data.
- **PROF-007:** Verification badges must indicate the verifying authority and scope.

### 10.3 Permissions

- **PERM-001:** Notification permission must be requested after an explanatory screen.
- **PERM-002:** Foreground location permission must be requested when a user uses location-dependent functionality.
- **PERM-003:** Camera or media-library permission must be requested when adding media.
- **PERM-004:** Denying permission must not prevent use of unrelated features.
- **PERM-005:** Manual location entry must remain available when location permission is denied.
- **PERM-006:** Background location must not be required for ordinary use.

### 10.4 Rescue case creation

- **CASE-001:** A user must be able to save an incomplete report as a local draft.
- **CASE-002:** A submitted emergency case must contain incident type, urgency, animal type, location, description, and reporter-presence state.
- **CASE-003:** At least one image should normally be required for emergency cases.
- **CASE-004:** The system must compress media before upload while preserving sufficient evidence quality.
- **CASE-005:** The system must remove embedded location metadata from public media.
- **CASE-006:** Location may be supplied by GPS, movable pin, or manual area selection.
- **CASE-007:** Users must be able to add a landmark in বাংলা or English.
- **CASE-008:** Users must preview an alert before submission.
- **CASE-009:** The system must warn about likely duplicate nearby cases.
- **CASE-010:** The creator must be able to correct factual information while preserving a change history.

### 10.5 Feed, search, and discovery

- **FEED-001:** Users must be able to view open cases in list and map formats.
- **FEED-002:** The default list should prioritize urgency, suitability, distance, and freshness—not popularity.
- **FEED-003:** Users must be able to filter by animal, status, incident type, distance, date, and required help.
- **FEED-004:** Closed cases must be discoverable separately from active cases.
- **FEED-005:** Public web pages must reveal only approved, non-sensitive information.
- **FEED-006:** Search must support বাংলা and English text where technically feasible.

### 10.6 Volunteer matching and notifications

- **ALERT-001:** Users must be able to select an alert radius.
- **ALERT-002:** Users must be able to configure animal, urgency, capability, and quiet-hour preferences.
- **ALERT-003:** Matching must use geospatial queries rather than downloading all user locations to the client.
- **ALERT-004:** Notifications must include case type, approximate area, and distance.
- **ALERT-005:** Notification taps must deep-link to the correct case.
- **ALERT-006:** A volunteer must not receive repeated initial alerts for the same case.
- **ALERT-007:** Radius expansion must stop when adequate assistance is committed or the case closes.
- **ALERT-008:** Critical alerts may expand from a small radius to larger configured radii when no response is received.
- **ALERT-009:** Quiet hours may be overridden only for users who explicitly enable critical-alert overrides.
- **ALERT-010:** Invalid or expired device tokens must be removed.

### 10.7 Response and assignment

- **RESP-001:** A user must be able to select **I can help** from an open case.
- **RESP-002:** The responder must select one or more assistance types.
- **RESP-003:** A responder may provide estimated arrival or availability time.
- **RESP-004:** A responder must be able to withdraw and provide a reason.
- **RESP-005:** Cases may have multiple responders with different responsibilities.
- **RESP-006:** The case must clearly show unfilled needs.
- **RESP-007:** A coordinator may mark assistance as confirmed, completed, declined, or unresponsive.
- **RESP-008:** Accepting a case must not imply legal ownership of the animal.

### 10.8 Comments and updates

- **COMM-001:** Registered users must be able to comment on active cases subject to moderation rules.
- **COMM-002:** Authorized participants must be able to post official case updates.
- **COMM-003:** Official updates must be visually distinct from general comments.
- **COMM-004:** Users must be able to reply to comments and mention participants.
- **COMM-005:** Users must be able to attach relevant media to updates.
- **COMM-006:** Editing or deleting content must preserve moderation evidence where required.
- **COMM-007:** Users must be able to report comments and media.
- **COMM-008:** Personal contact information should trigger a privacy warning before posting.

### 10.9 Maps and location

- **MAP-001:** The case screen must display the animal location and the user’s current position when permission is granted.
- **MAP-002:** The screen must show straight-line distance with an appropriate approximation label.
- **MAP-003:** Users must be able to open coordinates in an installed mapping application.
- **MAP-004:** Map attribution must remain visible.
- **MAP-005:** Exact foster, shelter, and sensitive-case coordinates must not be public.
- **MAP-006:** Map provider configuration must be remotely changeable.
- **MAP-007:** The first release must not depend on background map prefetching.
- **MAP-008:** User-triggered geocoding results must be cached and provider policies respected.

### 10.10 Temporary responder location

This is a post-MVP requirement.

- **LIVE-001:** Location sharing must be opt-in per case.
- **LIVE-002:** The responder must select or see an expiry time.
- **LIVE-003:** Sharing must stop automatically when expired, withdrawn, or the case closes.
- **LIVE-004:** Only authorized case participants may view responder location.
- **LIVE-005:** The interface must show when the location was last updated.
- **LIVE-006:** Historical responder coordinates must be deleted or reduced according to retention policy.

### 10.11 Case closure and rescue history

- **OUT-001:** Authorized users must select a structured closure outcome.
- **OUT-002:** A final update must be required for normal closure.
- **OUT-003:** The system must stop open-case notifications when closed.
- **OUT-004:** Participants may be credited only for selected contribution types.
- **OUT-005:** Moderators must be able to reopen an incorrectly closed case.
- **OUT-006:** Successful cases may appear in rescue history after privacy review.
- **OUT-007:** A resolved rescue may create a linked follow-up case.

### 10.12 Organizations, clinics, and shelters

- **ORG-001:** Organizations must be able to request verification.
- **ORG-002:** Verification must be approved manually by an administrator or designated verifier.
- **ORG-003:** Organizations must be able to maintain services, service area, hours, contact method, and availability.
- **ORG-004:** Organizations must explicitly opt into alert categories.
- **ORG-005:** Organization members must act through named accounts; shared credentials are prohibited.
- **ORG-006:** Sensitive organization and foster-capacity information must be role restricted.
- **ORG-007:** Directory records must show a last-confirmed date.

### 10.13 Moderation

- **MOD-001:** Users must be able to report a case, comment, profile, or media item.
- **MOD-002:** Report reasons must include spam, duplicate, fraud, cruelty, graphic content, unsafe advice, harassment, privacy exposure, and other.
- **MOD-003:** Moderators must be able to hide content pending review.
- **MOD-004:** Moderators must be able to merge duplicate cases while preserving references.
- **MOD-005:** Moderators must be able to redact personal information.
- **MOD-006:** Moderators must be able to warn, restrict, suspend, or ban accounts.
- **MOD-007:** Every moderation action must be audited.
- **MOD-008:** Appeals must be recorded and reviewable by a different authorized moderator where possible.
- **MOD-009:** Graphic images must be blurred by default where feasible.
- **MOD-010:** Abuse cases involving people must restrict sensitive location and identity information.

### 10.14 Localization

- **L10N-001:** Core workflows must be available in বাংলা and English.
- **L10N-002:** Users must be able to switch language without reinstalling the app.
- **L10N-003:** User-generated content must retain its original language.
- **L10N-004:** System statuses and notifications must use the recipient’s preferred language.
- **L10N-005:** Dates, times, phone numbers, and administrative names must display appropriately for Bangladesh.
- **L10N-006:** Translations must be reviewed by native speakers familiar with rescue terminology.

### 10.15 Offline and unreliable connectivity

- **OFF-001:** Incomplete reports must be stored locally.
- **OFF-002:** Failed submissions must remain recoverable.
- **OFF-003:** The app must display upload and synchronization state.
- **OFF-004:** Duplicate submissions caused by retries must be prevented through idempotency keys.
- **OFF-005:** Recently viewed case summaries may be cached.
- **OFF-006:** The app must not claim a case update succeeded until confirmed by the server.

---

## 11. Notification design

### 11.1 Notification categories

- New critical case nearby
- New urgent case nearby
- Radius-expanded case
- Response accepted or changed
- Official case update
- Reply or mention
- Case status changed
- Case closed
- Follow-up requested
- Moderation or account notification

### 11.2 Example nearby notification

> **Injured dog reported 2.4 km away**  
> Near Dhanmondi 27. Transport may be required.

### 11.3 Notification safeguards

- Group repeated updates for the same case.
- Respect quiet hours and category preferences.
- Do not include exact sensitive coordinates on the lock screen.
- Do not reveal private medical, foster, or contact information.
- Stop notifications after closure, suspension, or invalidation.
- Record delivery attempts without treating delivery as proof the user saw the notification.

---

## 12. Trust, safety, and ethical requirements

### 12.1 Human safety

- Display bite and rabies warnings where relevant.
- Advise users not to approach aggressive, disoriented, or potentially rabid animals without trained assistance.
- Provide first-aid guidance for human bites or scratches with a clear instruction to seek professional medical care.
- Do not provide instructions that encourage untrained users to administer medication.
- Let users indicate traffic, violence, electrical, water, height, or other hazards.

### 12.2 Animal safety

- Do not encourage relocating healthy community animals without lawful and welfare-based justification.
- Avoid advice that could worsen injury.
- Distinguish rescue, temporary foster, shelter, return, and adoption outcomes.
- Require stronger privacy controls for animals at risk of abuse, trafficking, or theft.

### 12.3 Privacy

- Use approximate public locations where appropriate.
- Reveal exact coordinates only to authorized users according to case policy.
- Never publish foster-home addresses.
- Hide phone numbers by default.
- Remove EXIF location metadata from public media.
- Provide account deletion and data export processes.
- Define retention periods for location, audit, moderation, and media data.
- Avoid collecting background location unless a user explicitly enables temporary sharing.

### 12.4 Anti-fraud

- Do not permit direct fundraising in the MVP.
- Flag repeated copied images and duplicate locations for moderator review.
- Apply rate limits to new accounts.
- Restrict mass messaging.
- Record status and content history.
- Avoid displaying raw report counts as a reputation metric.

### 12.5 Disclaimers

The product must state that:

- It does not guarantee a responder.
- Community-reported urgency is not a veterinary diagnosis.
- Volunteers act independently unless explicitly representing a verified organization.
- Users should contact appropriate public authorities or medical services for immediate human danger.

---

## 13. Volunteer reputation and achievements

Reputation must represent verified contributions rather than engagement volume.

### 13.1 Contribution categories

- On-site responder
- Transport volunteer
- Foster provider
- Veterinary support
- Case coordinator
- Organization responder
- Adoption facilitator
- Moderator contribution

### 13.2 Verification rules

A contribution may be verified by:

- Case creator confirmation.
- Case coordinator confirmation.
- Verified organization confirmation.
- Moderator review.
- Consistent confirmation from multiple participants.

### 13.3 Prohibited incentives

Do not reward:

- Number of reports alone.
- Graphic content.
- Speed that encourages unsafe travel.
- Competing for exclusive control of cases.
- Unverified monetary claims.

A public leaderboard is out of scope for the MVP.

---

## 14. AI-assisted features

AI features are post-MVP and must remain assistive.

Potential uses:

- Suggest animal species.
- Detect unusable, dark, or unrelated images.
- Suggest visible-condition labels.
- Identify possible duplicate reports.
- Generate accessibility descriptions.
- Assist moderators with content prioritization.

Requirements:

- Results must be labeled as suggestions.
- Users must confirm generated labels.
- AI must not diagnose, prescribe treatment, determine death, or close a case.
- Models must be evaluated on local animal types, image conditions, and bias.
- Graphic images must not be sent to third parties without appropriate disclosure and controls.

---

## 15. Information architecture

### 15.1 Mobile navigation

Recommended primary tabs:

1. **Nearby** — prioritized list and map of active cases.
2. **Report** — prominent rescue-report action.
3. **My activity** — created, responding, watching, and completed cases.
4. **Directory** — verified organizations, clinics, and support resources.
5. **Profile** — capabilities, availability, notification settings, and rescue history.

### 15.2 Web structure

- Public home page
- Public rescue case page
- Open cases
- Rescue history
- Safety and education
- Organization directory
- Sign in/register
- User dashboard
- Organization dashboard
- Moderator dashboard
- Administration

---

## 16. Design and accessibility requirements

The selected system is **Rescue UI**: a custom Material 3-inspired design system implemented with gluestack UI, NativeWind, and shared TypeScript tokens. Its full specification is maintained in `DESIGN.md`.

- Use a calm, high-contrast visual system.
- Reserve red for critical danger and destructive actions.
- Do not rely on color alone for status.
- Minimum interactive target size: 44 × 44 logical pixels.
- Support screen readers and meaningful accessibility labels.
- Provide text alternatives for uploaded images where possible.
- Respect system font scaling.
- Avoid dense map-first interfaces on low-end devices.
- Blur graphic media until the user chooses to reveal it.
- Ensure core flows meet WCAG 2.2 AA principles where applicable.
- Test Bangla typography, line wrapping, and mixed বাংলা/English content.
- Provide clear empty, loading, offline, error, and permission-denied states.

---

## 17. Technical architecture

### 17.1 Recommended stack

| Layer | Technology |
|---|---|
| Mobile | React Native with Expo |
| Web and administration | Next.js |
| Language | TypeScript |
| Monorepo | pnpm workspaces and Turborepo |
| Backend platform | Supabase |
| Database | PostgreSQL with PostGIS |
| Authentication | Supabase Auth |
| Realtime | Supabase Realtime |
| Server logic | Supabase Edge Functions and PostgreSQL functions |
| Media | Supabase Storage |
| Push notifications | Expo Notifications with FCM/APNs |
| Mobile maps | MapLibre React Native |
| Web maps | MapLibre GL JS |
| Initial vector tiles | OpenFreeMap |
| Future self-hosted maps | Protomaps/PMTiles |
| Offline drafts | Expo SQLite |
| Data fetching | TanStack Query |
| Client state | Zustand |
| Validation | Zod |
| Design system | Rescue UI using gluestack UI and NativeWind |
| Unit testing | Vitest or Jest |
| Component testing | React Native Testing Library |
| Web end-to-end testing | Playwright |
| Mobile end-to-end testing | Maestro |
| CI | GitHub Actions |

### 17.2 Architecture principles

- Use direct Supabase access only where Row Level Security safely permits it.
- Use Edge Functions for privileged workflows, notifications, moderation, and multi-step mutations.
- Store geographic points using PostGIS geography types and GiST indexes.
- Keep tile, geocoding, routing, and notification providers behind configuration interfaces.
- Use idempotency keys for case creation, notifications, and retryable mutations.
- Generate database types for TypeScript clients.
- Keep business rules out of UI components.
- Use feature flags for incomplete or high-risk functionality.

### 17.3 Monorepo structure

```text
rescue-alert/
���── apps/
│   ├── mobile/
│   └── web/
├── packages/
│   ├── api/
│   ├── types/
│   ├── validation/
│   ├── localization/
│   ├── design-tokens/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
└── docs/
    ├── PRD.md
    ├── DESIGN.md
    ├── database-design.md
    ├── privacy-model.md
    ├── moderation-policy.md
    └── incident-response.md
```

---

## 18. Data model

### 18.1 Primary entities

- `profiles`
- `user_private_details`
- `user_devices`
- `notification_preferences`
- `volunteer_capabilities`
- `user_availability`
- `rescue_cases`
- `rescue_case_locations`
- `rescue_media`
- `case_status_history`
- `case_responses`
- `case_needs`
- `case_updates`
- `case_comments`
- `comment_replies`
- `case_watchers`
- `rescue_outcomes`
- `organizations`
- `organization_members`
- `organization_services`
- `organization_availability`
- `clinics`
- `shelters`
- `foster_profiles`
- `contributions`
- `achievements`
- `user_achievements`
- `content_reports`
- `moderation_actions`
- `account_restrictions`
- `audit_logs`

### 18.2 Core `rescue_cases` fields

```text
id
creator_id
public_reference
incident_type
animal_type
urgency
status
title
description
location geography(Point, 4326)
approximate_location geography(Point, 4326)
division
district
upazila_or_thana
landmark
reported_at
last_seen_at
creator_on_site
exact_location_visibility
coordinator_id
organization_id
created_at
updated_at
closed_at
closure_reason
```

### 18.3 Location privacy model

Maintain separate concepts for:

- Exact operational coordinate.
- Approximate public coordinate.
- Human-readable landmark.
- Administrative area.
- Sensitive destination coordinate.

Do not derive public coordinates on the client from unrestricted exact data.

### 18.4 Suggested indexes

- GiST index on active-case geography.
- GiST index on volunteer alert geography or saved alert zones.
- Partial index on open cases.
- Index on case status and creation time.
- Index on creator and responder relationships.
- Unique index for active device push tokens.
- Search index for supported text fields where appropriate.

---

## 19. Geospatial matching

### 19.1 Initial matching inputs

- Case urgency.
- Case location.
- Volunteer alert radius.
- Volunteer availability.
- Volunteer capability.
- Preferred animal types.
- Quiet hours.
- Account trust status.
- Existing response commitments.

### 19.2 Radius strategy

Suggested starting behavior:

- Critical urban cases begin with a small local radius.
- The radius expands when no suitable responder commits within a configured interval.
- Foster, shelter, and adoption needs use broader areas without emergency alert behavior.
- Users control their maximum radius and categories.

All distances shown as straight-line distances must be labeled appropriately. Routing ETA is not part of the MVP.

---

## 20. Media requirements

- Accept common image formats from camera and gallery.
- Generate thumbnails.
- Compress large images before upload.
- Remove EXIF GPS metadata from public derivatives.
- Store original media only when operationally necessary and access controlled.
- Apply upload size and count limits through configuration.
- Scan file type rather than trusting filename extensions.
- Use signed URLs for restricted media.
- Allow moderators to blur, hide, or remove media.
- Avoid autoplay for video.
- Video is optional and may be deferred if it creates reliability problems.

---

## 21. Security requirements

- Enable Row Level Security on all exposed tables.
- Deny access by default and grant narrow policies.
- Never expose service-role credentials to mobile or web clients.
- Validate all Edge Function inputs with shared schemas.
- Apply rate limits to registration, sign-in, case creation, comments, responses, and reports.
- Use CAPTCHA or equivalent abuse protection where appropriate.
- Protect privileged actions with role checks and audit logs.
- Prevent user enumeration during sign-in and password recovery.
- Rotate compromised push tokens and credentials.
- Sanitize user-generated text and links.
- Use signed upload paths tied to authenticated users.
- Apply idempotency protection to retryable writes.
- Back up database schema and essential data.
- Maintain a documented security and moderation incident process.

### 21.1 Row Level Security examples

- Public users may read only public case fields through a safe view.
- Authenticated users may read normal active-case details.
- Exact sensitive coordinates require participant or moderator authorization.
- Only creators and authorized coordinators may edit case details.
- Only comment authors may edit their own comments within policy limits.
- Moderators may access reported content according to role.
- Private user details remain accessible only to the owner and narrowly authorized functions.

---

## 22. Non-functional requirements

### 22.1 Performance

- The nearby list should become usable quickly on typical Bangladesh mobile connections.
- Paginate all feeds and comments.
- Return thumbnails instead of full images in lists.
- Use indexed geospatial queries.
- Avoid loading maps until the user opens map mode where possible.
- Prevent unbounded realtime subscriptions.

### 22.2 Reliability

- Case creation must be idempotent.
- Failed uploads must be retryable.
- Notification failures must not roll back a successfully created case.
- Scheduled radius expansion must not send duplicate alerts.
- Status transitions must be transactional.
- The UI must distinguish pending local state from confirmed server state.

### 22.3 Scalability

- Avoid architecture that requires scanning every user for each case.
- Keep geospatial matching in PostGIS.
- Make background processing replaceable if Edge Functions become insufficient.
- Store provider-specific identifiers behind internal abstractions.

### 22.4 Maintainability

- Use shared TypeScript types and validation.
- Document database migrations.
- Require code review for authorization and notification changes.
- Keep বাংলা and English message keys synchronized.
- Add automated tests for status transitions and Row Level Security policies.

### 22.5 Compatibility

- Prioritize Android because of expected local reach, while maintaining iOS support.
- Support a responsive web experience.
- Define the minimum supported OS versions before implementation based on device research.
- Test on low-memory Android devices.

---

## 23. Analytics and observability

The pilot should collect privacy-conscious operational events, including:

- Registration completed.
- Onboarding completed.
- Notification permission result.
- Report draft created.
- Report submitted.
- Report upload failed.
- Nearby alert generated.
- Notification opened.
- Response committed.
- Responder withdrew.
- Animal located.
- Case status changed.
- Case closed.
- Outcome recorded.
- Content reported.
- Moderation action completed.

Do not collect continuous movement histories or unnecessary personal information for analytics.

Operational dashboards should monitor:

- Active cases.
- Unanswered critical cases.
- Notification failures.
- Upload failures.
- Open moderation reports.
- Database and function errors.
- Suspicious report spikes.

---

## 24. Administrative and moderation dashboard

The web dashboard must support:

- Active critical-case queue.
- Reported-content queue.
- Duplicate-case review.
- User and organization verification.
- Account restriction management.
- Case status correction.
- Sensitive-location redaction.
- Organization and clinic directory management.
- Audit-log review.
- Configurable incident types, alert radii, and notification rules.
- বাংলা and English system-content management.

Destructive actions must require confirmation and a reason.

---

## 25. Public sharing and growth

Every eligible rescue case should have a public web page containing:

- Case type and animal type.
- Approximate area.
- Current status.
- Approved media.
- Required assistance.
- Last official update.
- Link to open the app or respond after signing in.

The page must generate useful social previews for Facebook, Messenger, and other sharing channels while excluding exact sensitive coordinates and personal contact information.

Growth should focus on operational partnerships rather than vanity acquisition:

- Recruit experienced rescuers as pilot coordinators.
- Onboard veterinary clinics and animal-welfare organizations.
- Launch in a constrained Dhaka pilot area.
- Publish transparent outcome summaries.
- Provide Bangla onboarding and safety materials.
- Expand geographically only when moderation and responder coverage are ready.

---

## 26. Rollout plan

### Phase 0 — Discovery and field validation

- Interview active rescuers, transport volunteers, foster providers, clinics, and organizations.
- Observe existing rescue coordination workflows.
- Validate the minimum report fields.
- Test language and terminology in বাংলা and English.
- Prototype report creation, nearby case, and response flows.
- Define moderation and escalation policies.
- Select the initial pilot geography.

### Phase 1 — Internal alpha

- Authentication and onboarding.
- Profiles and capabilities.
- Create and view rescue cases.
- Image upload.
- GPS, map pin, and manual landmark.
- Case comments and official updates.
- Basic status transitions.
- Moderator dashboard.
- Test data only or invited users.

### Phase 2 — Closed community pilot

- Nearby matching with PostGIS.
- Push notifications.
- Response commitments.
- External navigation.
- Rescue outcomes and history.
- Offline drafts.
- Public share pages.
- Verified organization accounts.
- Limited geographic rollout.

### Phase 3 — Operational expansion

- Foster and shelter matching.
- Clinic and organization directory.
- Dynamic radius expansion.
- Lost-and-found matching.
- Stronger volunteer verification.
- Improved moderation automation.
- Broader geographic availability.

### Phase 4 — Extended ecosystem

- Structured adoption workflow.
- Temporary responder live location.
- AI-assisted image and duplicate detection.
- Organization integrations.
- Public impact reporting.

---

## 27. Testing strategy

### 27.1 Automated testing

- Unit tests for validation and domain rules.
- Integration tests for database functions.
- Row Level Security tests for every role.
- Status-transition tests.
- Geospatial matching tests.
- Notification deduplication tests.
- Offline retry and idempotency tests.
- Web end-to-end tests for public and moderator flows.
- Mobile end-to-end tests for reporting and response.

### 27.2 Manual testing

- Low-bandwidth and intermittent connectivity.
- GPS disabled or inaccurate.
- Camera and location permission denied.
- বাংলা text entry and mixed-language content.
- Low-memory Android devices.
- Large image uploads.
- Graphic-image handling.
- Multiple volunteers accepting one case.
- Reporter disappearing after submission.
- Case closed while a responder is viewing it.
- Duplicate notifications.
- Deep linking from a cold application start.

### 27.3 Field testing

Use staged, supervised simulations before relying on the system for real emergencies. Do not create fake public animal emergencies for testing.

---

## 28. MVP release acceptance criteria

The MVP is ready for a closed pilot when:

1. A user can register, verify email, sign in, recover a password, and delete the account.
2. A user can create a complete rescue case using GPS or manual location.
3. A report survives network interruption without silent data loss.
4. A nearby eligible volunteer can receive and open a push notification.
5. The volunteer can commit to a specific assistance type.
6. Multiple volunteers can coordinate without overwriting each other.
7. The reporter or authorized coordinator can post official updates.
8. A case can be closed with a structured outcome and audit history.
9. Exact sensitive locations and private phone numbers are not exposed publicly.
10. Moderators can review reports, merge duplicates, restrict accounts, and audit actions.
11. Public share pages exclude sensitive data.
12. Core flows function in বাংলা and English.
13. Row Level Security tests pass for all exposed tables.
14. Map attribution is visible and provider policies are followed.
15. Safety and emergency disclaimers are visible in relevant flows.
16. Notification deduplication and radius-stop conditions are verified.
17. The system has a documented incident, moderation, and data-recovery procedure.

---

## 29. Key risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Too few responders | Cases remain unanswered | Launch in a constrained area with committed pilot volunteers |
| Notification fatigue | Users disable alerts | Preference controls, deduplication, relevance filtering, radius escalation |
| False or abusive reports | Harm to animals or volunteers | Rate limits, trust levels, moderation queue, audit history |
| Exposed exact locations | Abuse, theft, harassment | Approximate public location and role-based exact access |
| Unsafe volunteer behavior | Human or animal injury | Safety warnings, capability profiles, professional escalation |
| Duplicate reports | Fragmented coordination | Nearby/time-based duplicate detection and moderator merging |
| Poor connectivity | Lost or incomplete reports | Offline drafts, compressed media, retry queues, idempotency |
| Map-service dependency | Map outages | Provider abstraction and future PMTiles self-hosting path |
| Free-tier limits | Service interruption as usage grows | Quota monitoring, controlled rollout, replaceable components |
| Phone-number recycling | Account takeover risk | Verified email recovery and later stronger phone verification |
| Gamification abuse | Fake or risky activity | Verified contribution categories and no report-volume leaderboard |
| Stale organization records | Failed referrals | Last-confirmed dates and organization-managed availability |
| Legal or policy misunderstanding | Improper rescue actions | Local legal review and humane community-animal guidance |

---

## 30. Dependencies

- Supabase project with PostGIS enabled.
- Expo project and push-notification credentials.
- FCM configuration for Android and APNs configuration for iOS.
- MapLibre integration.
- OpenFreeMap-compatible style and attribution.
- Bangladesh administrative-area dataset with appropriate attribution.
- Email delivery suitable for account verification and recovery.
- Community moderators and pilot coordinators.
- Reviewed বাংলা translations.
- Reviewed rescue, bite, rabies, and handling safety content.
- Legal and privacy review before broad public launch.

---

## 31. Open questions

1. What exact Dhaka neighborhoods or city areas should the first pilot cover?
2. Which organizations and clinics are willing to participate formally?
3. Which animal types should be supported at launch?
4. Should exact case locations be available to all signed-in users or only accepted responders?
5. Who is permitted to close a case when the creator becomes unavailable?
6. What evidence is required to verify a successful rescue?
7. What are the initial alert-radius and escalation intervals?
8. How should suspected cruelty involving an identifiable person be escalated?
9. Which safety content can be reviewed by veterinary professionals?
10. What data-retention periods should apply to exact coordinates, media, comments, and audit logs?
11. Should phone/password login be enabled in the pilot, or should phone remain a contact field until stronger verification is available?
12. What minimum Android version reflects the likely volunteer device base?
13. Which cases may appear publicly in rescue history?
14. How will organization verification be renewed?
15. What is the policy for wildlife, livestock, and protected species?

---

## 32. Future documentation

Before implementation, this PRD should be accompanied by:

- Database schema and Row Level Security specification.
- API and Edge Function contract.
- Status-transition diagram.
- Notification-matching algorithm specification.
- Location privacy and retention policy.
- Moderation handbook.
- Incident-response plan.
- বাংলা terminology guide.
- Analytics event dictionary.
- Accessibility checklist.
- Pilot operations playbook.

---

## 33. Research references

- Bangladesh Animal Welfare Act, 2019: http://bdlaws.minlaw.gov.bd/act-details-1292.html
- Bangladesh Animal Welfare Association: https://bawabd.org/
- Bangladesh rabies-control research: https://pmc.ncbi.nlm.nih.gov/articles/PMC11321326/
- Dhaka free-roaming dog and CNVR study: https://pubmed.ncbi.nlm.nih.gov/25978406
- MapLibre React Native: https://maplibre.org/maplibre-react-native/
- OpenFreeMap: https://openfreemap.org/
- OpenStreetMap tile policy: https://operations.osmfoundation.org/policies/tiles
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim
- Supabase PostGIS guide: https://supabase.com/docs/guides/database/extensions/postgis
- Supabase password authentication: https://supabase.com/docs/guides/auth/passwords
- Supabase Edge Function background tasks: https://supabase.com/docs/guides/functions/background-tasks
- Expo push notifications: https://docs.expo.dev/guides/using-push-notifications-services
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite
- Protomaps/PMTiles: https://protomaps.com/
- Bangladesh administrative boundaries: https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-bangladesh

---

## 34. Document ownership and review

This PRD is a living document. Product, engineering, moderation, veterinary-safety, localization, privacy, and pilot-operations stakeholders should review relevant sections before implementation. Material changes to location visibility, notification behavior, volunteer reputation, moderation powers, or case closure must be documented and approved before release.
