"use client";

import { useCallback, useEffect, useState } from "react";
import { listFeedCases, type FeedCase } from "@rescue-alert/api";
import { feedFiltersSchema } from "@rescue-alert/validation";
import { markerTypeForCase } from "@rescue-alert/maps";
import { translate, useLocale } from "@rescue-alert/localization";
import { createClient } from "../lib/supabase/client";
import { CaseCard } from "./CaseCard";
import { LocationMap, type LocationMapMarker } from "./LocationMap";
import { INCIDENT_LABEL_KEY, INCIDENT_TYPES } from "./incidentTypeLabels";

const RADIUS_OPTIONS_KM = [5, 10, 25, 50] as const;

type AnimalType = {
  id: string;
  slug: string;
  label_en: string;
  label_bn: string;
};

const PAGE_SIZE = 20;

export function FeedList({ animalTypes }: { animalTypes: AnimalType[] }) {
  const { locale, setLocale } = useLocale();
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate(locale, key, params);

  const [searchText, setSearchText] = useState("");
  const [animalTypeId, setAnimalTypeId] = useState<string>("");
  const [incidentType, setIncidentType] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<string>("");
  const [includeClosed, setIncludeClosed] = useState(false);
  const [viewerLocation, setViewerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  const [cases, setCases] = useState<FeedCase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  // Starts true, not false: the very first paint happens before the
  // load-on-mount effect has run at all, and cases starts as [] - a
  // real bug found in browser testing, an empty array plus a false
  // "loading" would flash "no cases match your filters" for an
  // instant before the real fetch even begins.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "map">("list");

  const loadPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      setError(null);

      const filters = feedFiltersSchema.parse({
        viewerLocation: viewerLocation ?? undefined,
        // A radius only means anything once a viewer location exists -
        // silently dropped otherwise rather than sent as a filter that
        // could never match anything.
        radiusMeters:
          viewerLocation && radiusKm ? Number(radiusKm) * 1000 : undefined,
        animalTypeIds: animalTypeId ? [animalTypeId] : undefined,
        incidentTypes: incidentType ? [incidentType] : undefined,
        searchText: searchText || undefined,
        includeClosed,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      const { data, error: rpcError } = await listFeedCases(
        createClient(),
        filters,
      );

      setLoading(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const rows = data ?? [];
      setTotalCount(rows[0]?.total_count ?? 0);
      setCases((current) => (replace ? rows : [...current, ...rows]));
      setOffset(nextOffset);
    },
    [
      viewerLocation,
      radiusKm,
      animalTypeId,
      incidentType,
      searchText,
      includeClosed,
    ],
  );

  // Reload from the top whenever a filter changes - CASE-... "closed
  // and active cases never intermix" holds per call already (the RPC
  // itself only ever returns one set), and this additionally resets
  // pagination so switching filters never mixes two different
  // result sets across pages.
  useEffect(() => {
    // Deferred to a microtask so loadPage's own setLoading(true) never
    // runs synchronously inside the effect body (react-hooks/
    // set-state-in-effect) - still resolves before paint, so there is
    // no visible behavior change from calling it directly.
    void Promise.resolve().then(() => loadPage(0, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPage's own identity already reflects every filter dependency
  }, [
    viewerLocation,
    radiusKm,
    animalTypeId,
    incidentType,
    searchText,
    includeClosed,
  ]);

  // Part 10 "bounded realtime subscriptions that unsubscribe on
  // unmount" - one channel per FeedList instance, torn down in the
  // effect's cleanup. Any insert/update/delete on rescue_cases
  // refreshes page 1 (debounced, so a burst of changes only refetches
  // once) - deliberately not attempted for pages beyond the first,
  // since silently reshuffling a list the user has already scrolled
  // past would be more disruptive than useful; a user who has paged
  // further can still refresh manually by changing a filter.
  useEffect(() => {
    const client = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const channel = client
      .channel("feed-rescue-cases-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rescue_cases" },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (offset === 0) void loadPage(0, true);
          }, 500);
        },
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      void client.removeChannel(channel);
    };
    // Re-subscribes (clean unsubscribe, then a fresh channel) whenever
    // loadPage or offset changes, so the closure's `offset === 0`
    // check and the filters loadPage captures are never stale - each
    // resubscribe is cheap and still always torn down via cleanup
    // first, so this does not accumulate channels.
  }, [loadPage, offset]);

  function handleUseLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const markers: LocationMapMarker[] = cases
    .filter(
      (c) => c.approximate_latitude != null && c.approximate_longitude != null,
    )
    .map((c) => ({
      id: c.id,
      type: markerTypeForCase(c.urgency, c.status),
      position: {
        latitude: c.approximate_latitude!,
        longitude: c.approximate_longitude!,
      },
      label: c.title,
    }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{t("feed_heading")}</h1>
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "bn" : "en")}
          className="rounded-full border border-border px-4 py-2 text-text"
        >
          {locale === "en" ? "বাংলা" : "English"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={t("feed_search_placeholder")}
          className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
        />

        <select
          value={animalTypeId}
          onChange={(event) => setAnimalTypeId(event.target.value)}
          className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
        >
          <option value="">{t("feed_filter_all_animals")}</option>
          {animalTypes.map((animalType) => (
            <option key={animalType.id} value={animalType.id}>
              {locale === "bn" ? animalType.label_bn : animalType.label_en}
            </option>
          ))}
        </select>

        <select
          value={incidentType}
          onChange={(event) => setIncidentType(event.target.value)}
          className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
        >
          <option value="">{t("feed_filter_all_incident_types")}</option>
          {INCIDENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(INCIDENT_LABEL_KEY[type])}
            </option>
          ))}
        </select>

        {viewerLocation && (
          <select
            value={radiusKm}
            onChange={(event) => setRadiusKm(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          >
            <option value="">{t("feed_filter_any_distance")}</option>
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                {t("feed_filter_radius_km", { km })}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeClosed(false)}
            className={[
              "min-h-11 rounded-full border px-4 py-2 text-text",
              !includeClosed
                ? "border-primary bg-primary-container"
                : "border-border",
            ].join(" ")}
          >
            {t("feed_show_active")}
          </button>
          <button
            type="button"
            onClick={() => setIncludeClosed(true)}
            className={[
              "min-h-11 rounded-full border px-4 py-2 text-text",
              includeClosed
                ? "border-primary bg-primary-container"
                : "border-border",
            ].join(" ")}
          >
            {t("feed_show_closed")}
          </button>
          <button
            type="button"
            disabled={locating}
            onClick={handleUseLocation}
            className="min-h-11 rounded-full border border-border px-4 py-2 text-text disabled:opacity-50"
          >
            {t("feed_use_my_location")}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={[
              "min-h-11 rounded-full border px-4 py-2 text-text",
              mode === "list"
                ? "border-primary bg-primary-container"
                : "border-border",
            ].join(" ")}
          >
            {t("feed_view_list")}
          </button>
          <button
            type="button"
            onClick={() => setMode("map")}
            className={[
              "min-h-11 rounded-full border px-4 py-2 text-text",
              mode === "map"
                ? "border-primary bg-primary-container"
                : "border-border",
            ].join(" ")}
          >
            {t("feed_view_map")}
          </button>
        </div>
      </div>

      {error && <p className="text-critical">{error}</p>}

      {mode === "map" ? (
        <div className="h-96 w-full">
          <LocationMap markers={markers} />
        </div>
      ) : cases.length === 0 && !loading ? (
        <p className="text-text-muted">{t("feed_no_results")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((feedCase) => (
            <CaseCard key={feedCase.id} feedCase={feedCase} />
          ))}
        </div>
      )}

      {mode === "list" && cases.length < totalCount && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPage(offset + PAGE_SIZE, false)}
          className="min-h-12 rounded-full border border-border px-4 py-2 text-text disabled:opacity-50"
        >
          {t("feed_load_more")}
        </button>
      )}
    </div>
  );
}
