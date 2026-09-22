# Rescue Alert Design System

**System name:** Rescue UI  
**Version:** 1.0  
**Platforms:** Android, iOS, responsive web, and administration web  
**Languages:** বাংলা and English  
**Implementation:** gluestack UI, NativeWind, and shared design tokens  
**Design foundation:** Material Design 3 semantics with a minimal, high-contrast visual direction

---

## 1. Recommendation

Rescue Alert should use a custom design system called **Rescue UI**.

Rescue UI combines:

- Material Design 3's semantic color roles, accessible hierarchy, interaction patterns, and Android familiarity.
- A minimal and high-contrast visual direction inspired by the strongest relevant categories in Refero Styles.
- gluestack UI as the open-source, cross-platform component foundation for Expo, React Native, and Next.js.
- NativeWind for shared utility-based styling where a component abstraction is unnecessary.
- Shared TypeScript design tokens for color, typography, spacing, shape, elevation, motion, and responsive behavior.

Refero Styles is best used as an inspiration and documentation library rather than as the runtime component system. Its **Minimal Design**, **High Contrast**, and **Clean SaaS** directions are the best fit for Rescue Alert. The product should avoid playful, luxury, editorial, or gradient-heavy styles because emergency coordination requires speed, clarity, and trust.

---

## 2. Why this system fits Rescue Alert

### 2.1 Material Design 3 as the interaction foundation

Material Design 3 provides:

- Familiar Android interaction behavior.
- Semantic color roles rather than arbitrary component colors.
- Accessible contrast pairings.
- Clear states for buttons, forms, navigation, dialogs, sheets, and notifications.
- Touch-friendly sizing.
- Established patterns for urgent mobile workflows.

Rescue Alert should use Material principles without looking like an unmodified Google application.

### 2.2 gluestack UI as the implementation foundation

gluestack UI is recommended because it:

- Supports React Native, Expo, React, and Next.js.
- Enables shared component behavior across mobile and web.
- Provides accessible component primitives.
- Uses a copy-paste ownership model, reducing vendor lock-in.
- Integrates with NativeWind and Tailwind-style tokens.
- Allows the project to customize components for rescue-specific workflows.

### 2.3 Why not use React Native Paper alone

React Native Paper is a strong Material implementation for mobile, but the Rescue Alert project also needs a substantial Next.js website and administration interface. Using Paper for mobile and another system for web would increase visual and maintenance divergence.

### 2.4 Why not make Tamagui the default

Tamagui is capable and optimized for universal applications. It is a valid alternative when the team is comfortable with its compiler and configuration. Rescue Alert's initial community team will benefit more from gluestack's component ownership model and NativeWind familiarity.

---

## 3. Design principles

### 3.1 Action before decoration

Every active-case screen should answer these questions immediately:

1. What happened?
2. How urgent is it?
3. Where is the animal?
4. Is anyone responding?
5. What help is still needed?
6. What is the safest next action?

### 3.2 Calm urgency

The interface must communicate urgency without creating panic. Critical red should appear only where immediate attention is required. Most surfaces should remain neutral and calm.

### 3.3 Location with context

A map pin alone is not enough. Always combine location with:

- Approximate distance.
- Administrative area.
- Landmark.
- Last-seen time.
- Location accuracy or approximate-location label.

### 3.4 Safety is visible

Safety guidance must not be hidden in settings. Show contextual guidance when the case involves aggression, suspected rabies, traffic, abuse, electricity, height, water, or other hazards.

### 3.5 Privacy by default

Exact locations, phone numbers, foster-home addresses, and responder positions must never be visually exposed without authorization and explicit product intent.

### 3.6 Low-bandwidth clarity

The list view is the default discovery view. Maps, large media, and video should load only when needed.

### 3.7 Bilingual from the first component

Every component must support বাংলা and English strings, longer labels, mixed-language content, and font scaling.

### 3.8 No gamified emergencies

Avoid streaks, confetti, competitive leaderboards, glowing badges, and celebration during an unresolved rescue. Positive reinforcement belongs on verified outcome screens.

---

## 4. Brand direction

### 4.1 Personality

Rescue Alert should feel:

- Trustworthy
- Compassionate
- Capable
- Calm
- Local
- Direct
- Inclusive
- Safety-conscious

It should not feel:

- Childish
- Corporate-luxury
- Aggressively medical
- Sensational
- Overly cute
- Like a social-media popularity feed

### 4.2 Visual motif

Use a simple location-and-care motif. Suitable directions include:

- A location pin containing a subtle heart.
- A location pin combined with a protective hand.
- A restrained animal silhouette integrated with a location marker.

Avoid complex multi-animal logos, realistic injury imagery, generic medical crosses, and overused paw-print patterns throughout the interface.

### 4.3 Photography

Photography should be documentary, respectful, and authentic.

- Do not use graphic injury photographs in promotional areas.
- Blur graphic case media by default.
- Avoid staged stock imagery that misrepresents Bangladesh.
- Preserve the animal as the focal point.
- Do not use imagery that exposes private addresses or identifiable bystanders without consent.

---

## 5. Color system

Rescue UI uses semantic roles. Components must reference role tokens rather than raw hex values.

### 5.1 Light theme

| Token | Value | Usage |
|---|---:|---|
| `color.primary` | `#0B6B58` | Primary actions, active navigation, selected controls |
| `color.onPrimary` | `#FFFFFF` | Content on primary surfaces |
| `color.primaryContainer` | `#D5F3E9` | Selected or supportive primary containers |
| `color.onPrimaryContainer` | `#073B31` | Content on primary containers |
| `color.secondary` | `#3E6259` | Secondary actions and icons |
| `color.secondaryContainer` | `#DDECE7` | Secondary selected states |
| `color.tertiary` | `#315D7A` | Informational emphasis |
| `color.background` | `#FCFDFC` | Main application background |
| `color.surface` | `#FFFFFF` | Cards, sheets, dialogs |
| `color.surfaceSubtle` | `#F3F6F4` | Grouped sections and skeletons |
| `color.surfaceStrong` | `#E8EEEB` | Stronger neutral containers |
| `color.text` | `#17201D` | Primary text |
| `color.textMuted` | `#58635F` | Secondary text |
| `color.border` | `#CAD4D0` | Standard boundaries |
| `color.borderStrong` | `#8E9B96` | High-emphasis boundaries and input focus support |
| `color.focus` | `#006CFF` | Keyboard and accessibility focus ring |
| `color.scrim` | `rgba(0, 0, 0, 0.45)` | Modal scrim |

### 5.2 Semantic status colors

| Token | Value | Usage |
|---|---:|---|
| `status.critical` | `#B3261E` | Immediate danger or destructive warning |
| `status.criticalContainer` | `#FFDAD6` | Critical banners and selected filters |
| `status.urgent` | `#9B4A00` | Urgent but not immediately life-threatening |
| `status.urgentContainer` | `#FFE0C2` | Urgent case background |
| `status.support` | `#1D5B9F` | Transport, foster, and non-emergency support |
| `status.supportContainer` | `#D6E4FF` | Support-needed background |
| `status.success` | `#26734D` | Verified rescue success and completion |
| `status.successContainer` | `#C8EFD8` | Successful outcome background |
| `status.warning` | `#765A00` | Safety warnings and incomplete data |
| `status.warningContainer` | `#FBE8A6` | Warning background |
| `status.neutral` | `#58635F` | Closed, unavailable, or neutral state |
| `status.neutralContainer` | `#E8EEEB` | Neutral state background |

### 5.3 Dark theme

| Token | Value |
|---|---:|
| `color.primary` | `#78D8BD` |
| `color.onPrimary` | `#00382C` |
| `color.primaryContainer` | `#005141` |
| `color.onPrimaryContainer` | `#A0F2D8` |
| `color.background` | `#101512` |
| `color.surface` | `#171D1A` |
| `color.surfaceSubtle` | `#202723` |
| `color.surfaceStrong` | `#2A332F` |
| `color.text` | `#E6ECE8` |
| `color.textMuted` | `#B7C2BD` |
| `color.border` | `#3E4944` |
| `color.borderStrong` | `#89948F` |

Semantic colors need separate dark-theme containers rather than mechanically inverted values.

### 5.4 Color rules

- Never communicate status using color alone; pair it with text and an icon.
- Use critical red only for critical state, destructive action, or serious error.
- Do not use red for ordinary notification counts.
- Use green for verified positive outcomes, not every primary action.
- Text must meet WCAG AA contrast.
- Map markers must remain distinguishable in common color-vision deficiencies.
- Do not allow user-generated profile colors to override semantic status colors.

---

## 6. Typography

### 6.1 Font families

- **English and Latin text:** Inter.
- **বাংলা text:** Noto Sans Bengali.
- **Fallback:** system sans-serif.
- **Code and identifiers:** system monospace only in technical administration views.

Bundle required font weights with the mobile application. Do not depend on downloading fonts during first launch.

### 6.2 Type scale

| Token | Size / line height | Weight | Usage |
|---|---|---:|---|
| `display.large` | 40 / 48 | 700 | Marketing hero only |
| `display.small` | 32 / 40 | 700 | Major web headings |
| `heading.1` | 28 / 36 | 700 | Screen title |
| `heading.2` | 24 / 32 | 700 | Major section |
| `heading.3` | 20 / 28 | 600 | Card group or dialog title |
| `title.large` | 18 / 26 | 600 | Rescue case title |
| `title.medium` | 16 / 24 | 600 | Card title and prominent label |
| `body.large` | 16 / 24 | 400 | Main body text |
| `body.medium` | 14 / 21 | 400 | Secondary content |
| `label.large` | 14 / 20 | 600 | Buttons and controls |
| `label.medium` | 12 / 18 | 600 | Status chips and metadata |
| `caption` | 12 / 18 | 400 | Timestamps and supporting metadata |

### 6.3 Typography rules

- Do not use uppercase for বাংলা labels.
- Avoid all-uppercase English labels except very short technical identifiers.
- Support at least 200% text scaling in critical workflows where platform behavior permits.
- Do not truncate case titles before the user can understand the incident.
- Use tabular numerals for distance, time, and operational counts when available.
- Use sentence case for buttons and headings.

---

## 7. Spacing and layout

### 7.1 Spacing tokens

```text
space.0 = 0
space.1 = 4
space.2 = 8
space.3 = 12
space.4 = 16
space.5 = 20
space.6 = 24
space.8 = 32
space.10 = 40
space.12 = 48
space.16 = 64
```

### 7.2 Layout rules

- Mobile page gutter: 16 pixels.
- Large mobile and tablet gutter: 24 pixels.
- Web content gutter: 24–48 pixels.
- Long-form web content maximum width: 760 pixels.
- Application content maximum width: 1200 pixels.
- Use 8-pixel alignment for most component dimensions.
- Separate major workflow regions with 24–32 pixels.
- Keep related form fields within 12–16 pixels.

### 7.3 Responsive breakpoints

```text
sm = 480
md = 768
lg = 1024
xl = 1280
```

Do not design by breakpoint alone. Components should respond to available width.

### 7.4 Platform composition

- Mobile uses bottom navigation and full-width pages.
- Tablet may use navigation rail and two-pane case detail.
- Desktop web uses a left navigation or top navigation depending on context.
- Moderator web may use denser tables, but all actions must remain keyboard accessible.

---

## 8. Shape and elevation

### 8.1 Radius tokens

| Token | Value | Usage |
|---|---:|---|
| `radius.none` | 0 | Full-bleed media and dividers |
| `radius.small` | 6 | Chips and compact controls |
| `radius.medium` | 10 | Inputs and buttons |
| `radius.large` | 14 | Cards and sheets |
| `radius.full` | 999 | Avatars and circular icon buttons only |

Avoid making every container pill-shaped.

### 8.2 Elevation

Prefer borders and surface contrast over heavy shadows.

- Level 0: flat page surface.
- Level 1: bordered case card.
- Level 2: sticky action region and bottom sheet.
- Level 3: dialog or temporary overlay.

Shadows must be subtle and must not replace visible boundaries.

---

## 9. Iconography

Use one open icon family consistently, preferably Lucide for shared web and native implementation.

Rules:

- Standard icon size: 20–24 pixels.
- Compact icon size: 16 pixels.
- Large status illustration icon: 32–48 pixels.
- Pair unfamiliar icons with labels.
- Do not use emoji as operational icons.
- Use filled or strongly emphasized icons only for selected navigation or critical state.
- Animal-type icons must have text labels.

Recommended operational icons:

- Location pin
- Navigation arrow
- Camera
- Image
- Bell
- Alert triangle
- Heart pulse
- Ambulance/transport
- Home/foster
- Hospital/clinic
- Message
- Users/responders
- Shield/verified
- Clock
- Check circle
- Eye off/private

---

## 10. Motion

Motion should confirm state changes, not decorate emergencies.

### 10.1 Duration tokens

```text
motion.fast = 120ms
motion.standard = 200ms
motion.slow = 320ms
```

### 10.2 Rules

- Respect reduced-motion settings.
- Avoid pulsing critical markers continuously.
- Use a brief state transition when a response is accepted.
- Do not use confetti on case closure.
- Skeleton loading may use a subtle, non-distracting shimmer or static placeholders.
- Map camera movement should be interruptible and should not cause motion sickness.

---

## 11. Core components

### 11.1 App shell

- Mobile bottom navigation.
- Tablet navigation rail.
- Web header and sidebar.
- Safe-area-aware page container.
- Offline banner.
- Critical service announcement banner.

### 11.2 Buttons

Variants:

- Primary
- Secondary
- Tonal
- Outline
- Text
- Destructive
- Icon
- Floating report action

Rules:

- Minimum height: 48 pixels for primary actions.
- Minimum target: 44 × 44 pixels.
- One dominant primary action per region.
- Destructive buttons require explicit wording such as **Close as false report**, not **Confirm**.
- Loading state must retain button width.

### 11.3 Form controls

- Text input
- Text area
- Password input
- Phone input with `+880`
- Search field
- Select
- Combobox
- Radio group
- Checkbox
- Switch
- Date/time field
- Location field
- Image picker
- Segmented urgency control

Every field requires label, help text where needed, error text, focus state, disabled state, and loading state.

### 11.4 Status chip

A compact label containing:

- Icon or marker
- Text
- Semantic background
- High-contrast text

Examples:

- Critical
- Urgent
- Support needed
- Responder en route
- Animal located
- At clinic
- Resolved
- Closed

Do not use chips for long sentences or primary actions.

### 11.5 Rescue case card

Required structure:

1. Media thumbnail with graphic-content treatment.
2. Urgency badge.
3. Animal and incident title.
4. Approximate area and distance.
5. Time since last confirmed sighting or update.
6. Current response state.
7. Remaining needs.
8. Primary contextual action.

Variants:

- Compact list card.
- Detailed feed card.
- Map preview card.
- User activity card.
- Closed outcome card.

Do not display likes or popularity counts.

### 11.6 Case header

The detail header should show:

- Urgency.
- Case title.
- Approximate location.
- Distance.
- Last update.
- Current status.
- Share and report actions.

The main rescue action should remain visible without obscuring content.

### 11.7 Official update

Official updates use:

- Left semantic accent.
- Actor identity and role.
- Timestamp.
- Update type.
- Clear content hierarchy.

Official updates must remain visually distinct from comments.

### 11.8 Responder card

Show:

- Responder or organization identity.
- Verification state.
- Assistance type.
- ETA or availability.
- Current commitment state.
- Coordinator controls when authorized.

Phone numbers and live locations must not appear without authorization.

### 11.9 Safety callout

Variants:

- Critical danger
- Warning
- Information
- Positive guidance

Structure:

- Icon
- Short heading
- Two or three concise instructions
- Optional link to full safety guidance

### 11.10 Empty and error states

Every major screen requires:

- Empty state.
- Loading state.
- Offline state.
- Permission-denied state.
- Partial failure state.
- Full error state.

Avoid blaming the user. Preserve drafts and offer a clear recovery action.

---

## 12. Maps and geospatial components

### 12.1 Map markers

| Marker | Shape | Meaning |
|---|---|---|
| Critical case | Red diamond/pin with alert icon | Immediate danger |
| Urgent case | Orange pin with clock/alert | Prompt help needed |
| Support case | Blue pin with support icon | Foster, transport, or supplies |
| Resolved case | Green check pin | Completed outcome |
| Current user | Blue location dot with accuracy ring | User position |
| Active responder | Teal navigation marker | Authorized temporary location |
| Clinic/organization | Neutral building/shield marker | Verified service point |

Markers must include an outline so they remain visible over varied map colors.

### 12.2 Location privacy states

- **Exact:** authorized operational coordinate.
- **Approximate:** public area-level coordinate.
- **Hidden:** location not rendered; area label only.
- **Expired:** previously shared live location is no longer available.

### 12.3 Map controls

- Recenter.
- Fit case and current user.
- Toggle list/map.
- Open external navigation.
- Report map/location issue.

Avoid excessive floating controls.

---

## 13. Navigation

### 13.1 Mobile navigation

Bottom navigation items:

1. Nearby
2. My activity
3. Directory
4. Profile

A prominent central or floating **Report** action may sit above the navigation, provided it remains accessible and does not obstruct content.

### 13.2 Web navigation

Public web:

- Open cases
- Rescue history
- Directory
- Safety
- About
- Sign in

Authenticated web:

- Nearby
- My activity
- Report
- Directory
- Notifications
- Profile

Administration:

- Critical queue
- Content reports
- Cases
- Users
- Organizations
- Directory
- Audit log
- Configuration

---

## 14. Screen specifications

### 14.1 Onboarding

- One idea per screen.
- Explain nearby alerts before asking for notification access.
- Explain foreground location before requesting it.
- Allow capability setup to be skipped and completed later.
- Do not request camera permission during registration.

### 14.2 Nearby feed

Priority order:

1. Critical cases matching capability.
2. Urgent cases matching capability.
3. Committed cases requiring additional support.
4. Other nearby open cases.
5. Foster, shelter, and adoption discovery.

Use list view by default. Map view is secondary.

### 14.3 Report flow

Recommended steps:

1. What happened?
2. Add photo.
3. Describe visible condition.
4. Confirm location.
5. Add landmark and details.
6. Review safety and privacy.
7. Preview and submit.

Show progress and save locally after every step.

### 14.4 Case detail

Recommended order:

1. Status and urgent action.
2. Media.
3. Location and navigation.
4. Remaining needs.
5. Responders.
6. Official timeline.
7. Discussion.
8. Safety guidance.
9. Report and privacy controls.

### 14.5 Close case

Closure must use a structured sheet or full screen:

- Select outcome.
- Add final update.
- Add optional media.
- Confirm participant contributions.
- Identify follow-up need.
- Review what becomes public.

Do not present closure as a simple destructive confirmation.

---

## 15. Accessibility requirements

- Meet WCAG 2.2 AA principles where applicable.
- Minimum text contrast: 4.5:1 for normal text.
- Minimum large-text and meaningful-boundary contrast: 3:1.
- Minimum target: 44 × 44 pixels.
- All icon buttons require accessible labels.
- All images require an accessibility description or a marked decorative state.
- Status cannot depend on color alone.
- Keyboard focus must always be visible on web.
- Modal focus must be trapped and restored correctly.
- Screen readers must announce case status changes and form errors.
- Map information must have an equivalent text/list representation.
- Support reduced motion.
- Support font scaling and reflow.
- Test with TalkBack, VoiceOver, keyboard-only web navigation, and browser zoom.

---

## 16. বাংলা and localization guidance

- Use Noto Sans Bengali for reliable glyph rendering.
- Keep বাংলা button labels concise but never sacrifice clarity.
- Avoid concatenating translated fragments.
- Use interpolation with complete localized sentences.
- Allow mixed বাংলা and English place names.
- Store canonical administrative identifiers separately from translated labels.
- Test line height with Bengali vowel marks and conjuncts.
- Avoid narrow fixed-width buttons for translated text.
- Use Bangladesh date/time conventions appropriate to the selected language.
- Keep phone normalization separate from visual formatting.

---

## 17. Content design

### 17.1 Voice

- Direct
- Calm
- Respectful
- Non-judgmental
- Actionable
- Honest about uncertainty

### 17.2 Preferred wording

Use:

- **I can help**
- **Responder en route**
- **Animal last seen 12 minutes ago**
- **Location is approximate**
- **Professional help recommended**
- **Could not send. Your report is saved on this device.**

Avoid:

- **Claim this rescue**
- **Hero points**
- **Guaranteed rescue**
- **Diagnosis confirmed**
- **Nobody cares yet**
- **You failed to submit**

### 17.3 Error pattern

A useful error message states:

1. What happened.
2. Whether data is safe.
3. What the user can do next.

Example:

> The photo could not be uploaded. Your report is saved. Try again now or submit the remaining details first.

---

## 18. Design tokens and implementation

### 18.1 Package structure

```text
packages/
├── design-tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── elevation.ts
│   ├── motion.ts
│   └── breakpoints.ts
├── ui/
│   ├── primitives/
│   ├── components/
│   ├── patterns/
│   └── index.ts
└── icons/
```

### 18.2 Component layers

1. **Tokens** — platform-neutral design decisions.
2. **Primitives** — text, stack, button base, input base, surface, divider.
3. **Components** — field, status chip, case card, callout, sheet, dialog.
4. **Patterns** — rescue header, responder list, official timeline, report step.
5. **Screens** — product-specific composition owned by each application.

### 18.3 Ownership rules

- Components copied from gluestack become project-owned source.
- Every shared component must include accessibility behavior and test coverage.
- Raw colors and spacing values are prohibited in feature components except during controlled migration.
- New tokens require design review.
- Platform-specific variants are allowed when interaction conventions differ.
- Web-only administration components should still use shared tokens.

### 18.4 Example semantic API

```tsx
<StatusChip tone="critical">Critical</StatusChip>

<SafetyCallout tone="warning" title="Do not approach yet">
  The animal appears disoriented. Contact a trained responder.
</SafetyCallout>

<RescueCaseCard
  urgency="urgent"
  distanceKm={2.4}
  status="open"
  needs={["transport", "veterinary-care"]}
/>
```

Feature code should express meaning such as `critical`, `warning`, or `success`; it should not select raw red, orange, or green values.

---

## 19. Component quality checklist

Before a shared component is considered complete:

- Light and dark themes work.
- বাংলা and English content fit.
- Text scaling does not break the layout.
- Keyboard navigation works on web.
- TalkBack and VoiceOver labels are meaningful.
- Focus, hover, pressed, disabled, loading, error, and selected states exist where relevant.
- Touch targets meet minimum size.
- Colors meet contrast requirements.
- No status depends only on color.
- Low-bandwidth and offline states are considered.
- The component has unit or interaction tests.
- Platform differences are documented.

---

## 20. Initial component build order

### Foundation

1. Tokens and themes.
2. Typography and icons.
3. Stack, surface, divider, and safe-area primitives.
4. Button and icon button.
5. Form fields and validation messages.
6. Sheet, dialog, menu, toast, and banner.

### Rescue-specific

7. Status chip.
8. Urgency selector.
9. Rescue case card.
10. Location field and map preview.
11. Media picker and upload state.
12. Safety callout.
13. Responder card.
14. Official update and timeline.
15. Needs selector.
16. Outcome selector.
17. Offline draft indicator.
18. Graphic-media cover.

### Navigation and administration

19. Mobile bottom navigation.
20. Web navigation shell.
21. Filter bar and filter sheet.
22. Data table and moderation queue.
23. Audit-history viewer.

---

## 21. References

- Refero Styles: https://styles.refero.design/
- Material Design 3 color roles: https://m3.material.io/styles/color/roles
- Android Material 3 theming: https://developer.android.com/codelabs/m3-design-theming
- gluestack UI: https://gluestack.io/ui/docs/home/overview/introduction
- gluestack accessibility: https://gluestack.io/ui/docs/home/core-concepts/accessibility
- Tamagui: https://tamagui.dev/
- React Native Paper: https://reactnativepaper.com/

---

## 22. Final decision

Use **Rescue UI**, a custom Material 3-inspired design system implemented with **gluestack UI + NativeWind + shared TypeScript tokens**.

Use Refero's minimal, high-contrast, and clean product styles as visual references, not as copied branding. This gives Rescue Alert a trustworthy and locally adaptable interface, one maintainable component system across Expo and Next.js, and an accessible foundation for urgent rescue coordination.
