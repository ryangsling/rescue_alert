// Push copy in both languages. Self-contained on purpose: the
// dispatch-alerts Edge Function imports this package directly, and Deno
// needs explicit .ts import paths that the app catalogs do not use. A
// test pins the incident labels below to the app catalogs so the two
// cannot drift.

export type Locale = "en" | "bn";

export type NotificationCategory =
  | "new_critical_case_nearby"
  | "new_urgent_case_nearby"
  | "radius_expanded_case"
  | "response_accepted_or_changed"
  | "official_case_update"
  | "reply_or_mention"
  | "case_status_changed"
  | "case_closed"
  | "follow_up_requested"
  | "moderation_or_account";

// Template inputs only. The database never puts coordinates, phone
// numbers, or foster addresses in a payload (PRD 11.3).
export interface NotificationPayload {
  incident_type?: string;
  urgency?: string;
  area?: string | null;
  distance_km?: number;
  count?: number;
}

export interface RenderedNotification {
  title: string;
  body: string;
}

const INCIDENT_LABELS = {
  en: {
    injured_animal: "Injured animal",
    road_accident: "Road accident",
    critically_ill_animal: "Critically ill animal",
    trapped_animal: "Trapped animal",
    abandoned_animal: "Abandoned animal",
    abuse_or_cruelty_suspected: "Abuse or cruelty suspected",
    mother_with_babies: "Mother with babies",
    orphaned_babies: "Orphaned babies",
    traffic_risk_animal: "Animal creating traffic risk",
    temporary_foster_needed: "Temporary foster needed",
    shelter_needed: "Shelter needed",
    transport_needed: "Transport needed",
    veterinary_treatment_needed: "Veterinary treatment needed",
    lost_animal_found: "Lost animal found",
    adoption_needed: "Adoption needed",
    other_animal_welfare_concern: "Other animal-welfare concern",
  },
  bn: {
    injured_animal: "আহত প্রাণী",
    road_accident: "সড়ক দুর্ঘটনা",
    critically_ill_animal: "মুমূর্ষু প্রাণী",
    trapped_animal: "আটকে পড়া প্রাণী",
    abandoned_animal: "পরিত্যক্ত প্রাণী",
    abuse_or_cruelty_suspected: "নির্যাতনের সন্দেহ",
    mother_with_babies: "বাচ্চাসহ মা",
    orphaned_babies: "অনাথ বাচ্চা",
    traffic_risk_animal: "যান চলাচলে ঝুঁকিপূর্ণ প্রাণী",
    temporary_foster_needed: "সাময়িক ফস্টার প্রয়োজন",
    shelter_needed: "আশ্রয় প্রয়োজন",
    transport_needed: "পরিবহন প্রয়োজন",
    veterinary_treatment_needed: "পশুচিকিৎসা প্রয়োজন",
    lost_animal_found: "হারানো প্রাণী পাওয়া গেছে",
    adoption_needed: "দত্তক প্রয়োজন",
    other_animal_welfare_concern: "অন্যান্য প্রাণী-কল্যাণ সংক্রান্ত",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const INCIDENT_LABEL_KEYS = Object.keys(INCIDENT_LABELS.en);
export { INCIDENT_LABELS };

const URGENCY_LABELS: Record<Locale, Record<string, string>> = {
  en: { critical: "Critical", urgent: "Urgent" },
  bn: { critical: "সংকটাপন্ন", urgent: "জরুরি" },
};

interface Copy {
  fallbackIncident: string;
  nearby: (p: {
    urgency: string;
    incident: string;
    distance: string;
    expanded: boolean;
  }) => string;
  nearbyBody: (area: string | null) => string;
  grouped: (count: string) => string;
  categories: Record<
    Exclude<
      NotificationCategory,
      | "new_critical_case_nearby"
      | "new_urgent_case_nearby"
      | "radius_expanded_case"
    >,
    { title: string; body: (incident: string) => string }
  >;
}

const COPY: Record<Locale, Copy> = {
  en: {
    fallbackIncident: "Your case",
    nearby: ({ urgency, incident, distance, expanded }) =>
      expanded
        ? `${urgency}: ${incident} still needs help, ${distance} km away`
        : `${urgency}: ${incident} reported ${distance} km away`,
    nearbyBody: (area) =>
      area
        ? `Near ${area}. Open Rescue Alert to see how you can help.`
        : "Open Rescue Alert to see how you can help.",
    grouped: (count) => `${count} new updates`,
    categories: {
      response_accepted_or_changed: {
        title: "A response on your case changed",
        body: (i) => `${i}: open the case to see who is helping.`,
      },
      official_case_update: {
        title: "New official update",
        body: (i) => `${i}: the case coordinator posted an update.`,
      },
      reply_or_mention: {
        title: "New reply or mention",
        body: (i) => `${i}: open the case to read it.`,
      },
      case_status_changed: {
        title: "Case status changed",
        body: (i) => `${i}: the status was updated. Open the case to see it.`,
      },
      case_closed: {
        title: "Case closed",
        body: (i) => `${i} has been closed.`,
      },
      follow_up_requested: {
        title: "Follow-up requested",
        body: (i) => `${i}: please add a follow-up update.`,
      },
      moderation_or_account: {
        title: "Account notice",
        body: () =>
          "There is an update about your account. Open Rescue Alert to read it.",
      },
    },
  },
  bn: {
    fallbackIncident: "আপনার কেস",
    nearby: ({ urgency, incident, distance, expanded }) =>
      expanded
        ? `${urgency}: ${incident}-এর জন্য এখনও সাহায্য দরকার, ${distance} কিমি দূরে`
        : `${urgency}: ${distance} কিমি দূরে ${incident} জানানো হয়েছে`,
    nearbyBody: (area) =>
      area
        ? `${area}-এর কাছে। কীভাবে সাহায্য করতে পারেন তা দেখতে Rescue Alert খুলুন।`
        : "কীভাবে সাহায্য করতে পারেন তা দেখতে Rescue Alert খুলুন।",
    grouped: (count) => `${count}টি নতুন আপডেট`,
    categories: {
      response_accepted_or_changed: {
        title: "আপনার কেসে সাড়া দেওয়ার তথ্য বদলেছে",
        body: (i) => `${i}: কে সাহায্য করছেন তা দেখতে কেসটি খুলুন।`,
      },
      official_case_update: {
        title: "নতুন অফিসিয়াল আপডেট",
        body: (i) => `${i}: কেস সমন্বয়কারী একটি আপডেট দিয়েছেন।`,
      },
      reply_or_mention: {
        title: "নতুন উত্তর বা উল্লেখ",
        body: (i) => `${i}: পড়তে কেসটি খুলুন।`,
      },
      case_status_changed: {
        title: "কেসের অবস্থা বদলেছে",
        body: (i) => `${i}: অবস্থা হালনাগাদ হয়েছে। দেখতে কেসটি খুলুন।`,
      },
      case_closed: {
        title: "কেস বন্ধ হয়েছে",
        body: (i) => `${i} কেসটি বন্ধ করা হয়েছে।`,
      },
      follow_up_requested: {
        title: "ফলো-আপ চাওয়া হয়েছে",
        body: (i) => `${i}: অনুগ্রহ করে একটি ফলো-আপ আপডেট দিন।`,
      },
      moderation_or_account: {
        title: "অ্যাকাউন্ট বিজ্ঞপ্তি",
        body: () =>
          "আপনার অ্যাকাউন্ট সম্পর্কে একটি আপডেট আছে। পড়তে Rescue Alert খুলুন।",
      },
    },
  },
};

const NUMBER_LOCALE: Record<Locale, string> = { en: "en", bn: "bn-BD" };

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    maximumFractionDigits: 1,
  }).format(value);
}

const NEARBY_CATEGORIES = [
  "new_critical_case_nearby",
  "new_urgent_case_nearby",
  "radius_expanded_case",
];

export function renderNotification(
  locale: Locale,
  category: NotificationCategory,
  payload: NotificationPayload,
): RenderedNotification {
  const copy = COPY[locale];
  const incident =
    (payload.incident_type &&
      (INCIDENT_LABELS[locale] as Record<string, string>)[
        payload.incident_type
      ]) ||
    copy.fallbackIncident;

  if (NEARBY_CATEGORIES.includes(category)) {
    const urgency = URGENCY_LABELS[locale][payload.urgency ?? ""] ?? "";
    return {
      title: copy.nearby({
        urgency,
        incident,
        distance: formatNumber(locale, payload.distance_km ?? 0),
        expanded: category === "radius_expanded_case",
      }),
      body: copy.nearbyBody(payload.area ?? null),
    };
  }

  const entry = copy.categories[category as keyof Copy["categories"]];
  const grouped = (payload.count ?? 1) > 1;
  return {
    title: grouped
      ? copy.grouped(formatNumber(locale, payload.count as number))
      : entry.title,
    body: entry.body(incident),
  };
}
