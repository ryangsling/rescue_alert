"use client";

import { useEffect, useState } from "react";
import { getCaseMediaSignedUrl, type FeedCase } from "@rescue-alert/api";
import { formatApproximateDistance } from "@rescue-alert/maps";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import { createClient } from "../lib/supabase/client";
import { INCIDENT_LABEL_KEY } from "./incidentTypeLabels";

const URGENCY_CLASS: Record<string, string> = {
  critical: "bg-critical-container text-critical",
  urgent: "bg-urgent-container text-urgent",
  support_needed: "bg-support-container text-support",
  adoption_community: "bg-neutral-container text-neutral",
};

const URGENCY_LABEL_KEY: Record<string, TranslationKey> = {
  critical: "urgency_critical",
  urgent: "urgency_urgent",
  support_needed: "urgency_support_needed",
  adoption_community: "urgency_adoption_community",
};

/**
 * Human-readable fallback for case_status values with no dedicated
 * catalog key yet (rescue_in_progress, transporting, etc.) - Part 10
 * added only the two most common statuses (open, response_committed)
 * plus the pre-existing responder_en_route/animal_located/resolved/
 * closed keys from earlier parts. A full status catalog is deferred
 * rather than adding a dozen rarely-hit keys speculatively.
 */
function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const STATUS_LABEL_KEY: Partial<Record<string, TranslationKey>> = {
  open: "status_open",
  response_committed: "status_response_committed",
  responder_en_route: "status_responder_en_route",
  animal_located: "status_animal_located",
  resolved: "status_resolved",
  closed: "status_closed",
};

export function CaseCard({ feedCase }: { feedCase: FeedCase }) {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!feedCase.thumbnail_storage_path || feedCase.thumbnail_is_graphic) {
      return;
    }
    let cancelled = false;
    void getCaseMediaSignedUrl(
      createClient(),
      feedCase.thumbnail_storage_path,
    ).then(({ data }) => {
      if (!cancelled && data) setThumbnailUrl(data.signedUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [feedCase.thumbnail_storage_path, feedCase.thumbnail_is_graphic]);

  const statusKey = STATUS_LABEL_KEY[feedCase.status];
  const statusLabel = statusKey
    ? t(statusKey)
    : humanizeStatus(feedCase.status);
  const areaLabel = [feedCase.upazila_or_thana, feedCase.district]
    .filter(Boolean)
    .join(", ");
  const distanceLabel =
    feedCase.distance_meters != null
      ? formatApproximateDistance(feedCase.distance_meters, locale)
      : null;

  return (
    // Not a link: case detail (DESIGN.md 14.4) is Part 12's screen,
    // not built yet - linking to /cases/[reference] now would be a
    // dead 404. This card is browsable/filterable, not yet tappable.
    <div className="flex gap-3 rounded-medium border border-border bg-surface p-4">
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, not a static asset Next's optimizer can handle
        <img
          src={thumbnailUrl}
          alt=""
          className="h-20 w-20 flex-shrink-0 rounded-medium object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-1">
        <span
          className={[
            "inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold",
            URGENCY_CLASS[feedCase.urgency],
          ].join(" ")}
        >
          {t(URGENCY_LABEL_KEY[feedCase.urgency]!)}
        </span>
        <span className="font-semibold text-text">{feedCase.title}</span>
        <span className="text-sm text-text-muted">
          {t(INCIDENT_LABEL_KEY[feedCase.incident_type]!)}
        </span>
        <span className="text-sm text-text-muted">
          {[areaLabel, distanceLabel].filter(Boolean).join(" - ")}
        </span>
        <span className="text-xs text-text-muted">{statusLabel}</span>
      </div>
    </div>
  );
}
