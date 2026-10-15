# বাংলা terminology guide

Source of truth is always `packages/localization/src/catalogs/bn.ts` - if this guide and the catalog ever disagree, the catalog wins and this file should be updated to match. This guide exists for writing pilot-facing material that isn't pulled directly from the app (onboarding handouts, safety briefings, printed signage, verbal training) so the same term is used everywhere a volunteer encounters it, matching the design system's own principle that meaning should read the same everywhere it appears (DESIGN.md's urgency-chip rule, generalized).

## Urgency levels (`urgency_level`)

| English               | বাংলা             | Key                          |
| --------------------- | ----------------- | ---------------------------- |
| Critical              | সংকটাপন্ন         | `urgency_critical`           |
| Urgent                | জরুরি             | `urgency_urgent`             |
| Support needed        | সহায়তা প্রয়োজন  | `urgency_support_needed`     |
| Adoption or community | দত্তক বা কমিউনিটি | `urgency_adoption_community` |

## Incident types (`incident_type`)

| English                      | বাংলা                            |
| ---------------------------- | -------------------------------- |
| Injured animal               | আহত প্রাণী                       |
| Road accident                | সড়ক দুর্ঘটনা                    |
| Critically ill animal        | মুমূর্ষু প্রাণী                  |
| Trapped animal               | আটকে পড়া প্রাণী                 |
| Abandoned animal             | পরিত্যক্ত প্রাণী                 |
| Abuse or cruelty suspected   | নির্যাতনের সন্দেহ                |
| Mother with babies           | বাচ্চাসহ মা                      |
| Orphaned babies              | অনাথ বাচ্চা                      |
| Animal creating traffic risk | যান চলাচলে ঝুঁকিপূর্ণ প্রাণী     |
| Temporary foster needed      | সাময়িক ফস্টার প্রয়োজন          |
| Shelter needed               | আশ্রয় প্রয়োজন                  |
| Transport needed             | পরিবহন প্রয়োজন                  |
| Veterinary treatment needed  | পশুচিকিৎসা প্রয়োজন              |
| Lost animal found            | হারানো প্রাণী পাওয়া গেছে        |
| Adoption needed              | দত্তক প্রয়োজন                   |
| Other animal-welfare concern | অন্যান্য প্রাণী-কল্যাণ সংক্রান্ত |

## Volunteer capabilities (`volunteer_capability_type`)

| English                 | বাংলা                |
| ----------------------- | -------------------- |
| On-site rescue          | স্থান-ভিত্তিক উদ্ধার |
| Transport               | পরিবহন               |
| Veterinary professional | পশুচিকিৎসা পেশাদার   |
| Veterinary assistant    | পশুচিকিৎসা সহকারী    |
| Temporary foster        | সাময়িক ফস্টার       |
| Shelter coordination    | আশ্রয় সমন্বয়       |
| Adoption support        | দত্তক সহায়তা        |
| Case coordination       | কেস সমন্বয়          |

## Closure outcomes (`closure_outcome`, selected)

| English                        | বাংলা                                       |
| ------------------------------ | ------------------------------------------- |
| Successfully rescued           | সফলভাবে উদ্ধার করা হয়েছে                   |
| Treated and returned safely    | চিকিৎসা দিয়ে নিরাপদে ফিরিয়ে দেওয়া হয়েছে |
| Transferred to veterinary care | পশু চিকিৎসার জন্য হস্তান্তর করা হয়েছে      |
| Moved to temporary foster care | সাময়িক ফস্টার কেয়ারে নেওয়া হয়েছে        |
| Moved to shelter               | শেল্টারে নেওয়া হয়েছে                      |
| Adopted                        | দত্তক নেওয়া হয়েছে                         |
| Animal could not be found      | প্রাণীটি খুঁজে পাওয়া যায়নি                |
| Duplicate report               | ডুপ্লিকেট রিপোর্ট                           |

## Core product nouns

| English                 | বাংলা            | Notes                                                                                                                                            |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rescue case             | কেস / উদ্ধার কেস | "Case" is the operational unit everywhere in the app; don't translate it inconsistently across materials.                                        |
| Nearby alert            | আশপাশের সতর্কতা  | Matches the "Alert area" feature naming added in Part 20 (`account_alert_area_heading`).                                                         |
| Alert area / base point | সতর্কতা এলাকা    | The static point a volunteer sets - always describe as static/non-tracked when explaining it to volunteers (privacy model, section on location). |
| Official update         | অফিসিয়াল আপডেট  | Must stay visually and verbally distinct from an ordinary comment - this distinction is load-bearing (PRD COMM-002/003).                         |
| Responder / volunteer   | স্বেচ্ছাসেবক     | Consistent across onboarding and in-app copy.                                                                                                    |
| Moderator               | মডারেটর          | Loanword, used as-is in the catalog rather than translated.                                                                                      |

## Writing guidance for new pilot material

1. Check `packages/localization/src/catalogs/bn.ts` first for any term that might already exist in the app - never invent a second translation for a concept the app already names.
2. If a genuinely new term is needed, add it to both `en.ts` and `bn.ts` in the same change (this is a hard CI-enforced rule for in-app copy - AGENTS.md standard 7 - and good practice for printed material too, so the two stay reviewable side by side).
3. Have a fluent reviewer (not just a translation tool) check anything that will be printed or read aloud at an in-person pilot briefing - the catalog translations were written for in-app UI density and may not always suit a longer spoken or printed explanation.
