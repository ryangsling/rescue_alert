import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  Button,
  RescueCaseCard,
  SafeAreaContainer,
  Select,
  Stack,
  Text,
  TextField,
  type StatusChipTone,
} from "@rescue-alert/ui";
import {
  listFeedCases,
  getCaseMediaSignedUrl,
  type FeedCase,
} from "@rescue-alert/api";
import { feedFiltersSchema } from "@rescue-alert/validation";
import { markerTypeForCase } from "@rescue-alert/maps";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../supabase-client";
import { LocationMap } from "../components/LocationMap";

type AnimalType = {
  id: string;
  slug: string;
  label_en: string;
  label_bn: string;
};
type IncidentType = Database["public"]["Enums"]["incident_type"];

const PAGE_SIZE = 20;
const RADIUS_OPTIONS_KM = ["5", "10", "25", "50"] as const;

/** Mirrors apps/web/src/components/incidentTypeLabels.ts and apps/mobile/src/app/report.tsx's own copy - each app/screen keeps its own list rather than sharing a cross-platform package for a static, rarely-changing 16-value enum. */
const INCIDENT_TYPES: IncidentType[] = [
  "injured_animal",
  "road_accident",
  "critically_ill_animal",
  "trapped_animal",
  "abandoned_animal",
  "abuse_or_cruelty_suspected",
  "mother_with_babies",
  "orphaned_babies",
  "traffic_risk_animal",
  "temporary_foster_needed",
  "shelter_needed",
  "transport_needed",
  "veterinary_treatment_needed",
  "lost_animal_found",
  "adoption_needed",
  "other_animal_welfare_concern",
];

const INCIDENT_LABEL_KEY: Record<IncidentType, TranslationKey> = {
  injured_animal: "incident_injured_animal",
  road_accident: "incident_road_accident",
  critically_ill_animal: "incident_critically_ill_animal",
  trapped_animal: "incident_trapped_animal",
  abandoned_animal: "incident_abandoned_animal",
  abuse_or_cruelty_suspected: "incident_abuse_or_cruelty_suspected",
  mother_with_babies: "incident_mother_with_babies",
  orphaned_babies: "incident_orphaned_babies",
  traffic_risk_animal: "incident_traffic_risk_animal",
  temporary_foster_needed: "incident_temporary_foster_needed",
  shelter_needed: "incident_shelter_needed",
  transport_needed: "incident_transport_needed",
  veterinary_treatment_needed: "incident_veterinary_treatment_needed",
  lost_animal_found: "incident_lost_animal_found",
  adoption_needed: "incident_adoption_needed",
  other_animal_welfare_concern: "incident_other_animal_welfare_concern",
};

const STATUS_LABEL_KEY: Partial<Record<string, TranslationKey>> = {
  open: "status_open",
  response_committed: "status_response_committed",
  responder_en_route: "status_responder_en_route",
  animal_located: "status_animal_located",
  resolved: "status_resolved",
  closed: "status_closed",
};

const CLOSED_STATUSES = new Set([
  "resolved",
  "closed",
  "no_longer_found",
  "cancelled_by_reporter",
  "closed_by_moderator",
]);
const IN_PROGRESS_STATUSES = new Set([
  "response_committed",
  "responder_en_route",
  "animal_located",
  "rescue_in_progress",
  "transporting",
  "at_clinic_foster_shelter",
  "follow_up_required",
]);

function caseStatusTone(status: string): StatusChipTone {
  if (CLOSED_STATUSES.has(status)) return "success";
  if (IN_PROGRESS_STATUSES.has(status)) return "support";
  return "neutral";
}

function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * DESIGN.md 14.2 nearby feed - the app's default discovery surface.
 * Mirrors apps/web/src/components/FeedList.tsx's filter/pagination/
 * ranking behavior against the same list_feed_cases() RPC, using
 * @rescue-alert/ui's RescueCaseCard (built in Part 5) rather than a
 * from-scratch card, since packages/ui is available here unlike web.
 */
export default function Home() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [searchText, setSearchText] = useState("");
  const [animalTypeId, setAnimalTypeId] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [radiusKm, setRadiusKm] = useState<
    (typeof RADIUS_OPTIONS_KM)[number] | null
  >(null);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [viewerLocation, setViewerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  const [cases, setCases] = useState<FeedCase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadAnimalTypes() {
      const { data } = await supabase
        .from("animal_types")
        .select("id, slug, label_en, label_bn")
        .eq("is_active", true)
        .order("sort_order");
      setAnimalTypes(data ?? []);
    }
    void loadAnimalTypes();
  }, []);

  const loadPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      setLoading(true);
      setError(null);

      const filters = feedFiltersSchema.parse({
        viewerLocation: viewerLocation ?? undefined,
        radiusMeters:
          viewerLocation && radiusKm ? Number(radiusKm) * 1000 : undefined,
        animalTypeIds: animalTypeId ? [animalTypeId] : undefined,
        incidentTypes: incidentType ? [incidentType] : undefined,
        searchText: searchText || undefined,
        includeClosed,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      const { data, error: rpcError } = await listFeedCases(supabase, filters);

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

  useEffect(() => {
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

  useEffect(() => {
    let cancelled = false;
    async function loadThumbnails() {
      for (const feedCase of cases) {
        if (
          !feedCase.thumbnail_storage_path ||
          feedCase.thumbnail_is_graphic ||
          thumbnails[feedCase.id]
        ) {
          continue;
        }
        const { data } = await getCaseMediaSignedUrl(
          supabase,
          feedCase.thumbnail_storage_path,
        );
        if (!cancelled && data) {
          setThumbnails((current) => ({
            ...current,
            [feedCase.id]: data.signedUrl,
          }));
        }
      }
    }
    void loadThumbnails();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-runs when the case list itself changes
  }, [cases]);

  // Part 10 "bounded realtime subscriptions that unsubscribe on
  // unmount" - mirrors apps/web/src/components/FeedList.tsx's channel:
  // one per screen instance, torn down in the effect's cleanup, and
  // only auto-refreshing page 1 (debounced) so an already-scrolled
  // "load more" list is never silently reshuffled.
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
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
      void supabase.removeChannel(channel);
    };
  }, [loadPage, offset]);

  async function handleUseLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      setViewerLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } finally {
      setLocating(false);
    }
  }

  const markers = cases
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
    <SafeAreaContainer>
      <Stack gap="3" className="flex-1 p-6">
        <Stack direction="row" justify="between" align="center">
          <Text variant="heading1">{t("feed_heading")}</Text>
          <Button
            variant="outline"
            onPress={() => setLocale(locale === "en" ? "bn" : "en")}
          >
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
        </Stack>

        <TextField
          label={t("feed_search_placeholder")}
          value={searchText}
          onChangeText={setSearchText}
        />

        <Select
          label={t("feed_filter_animal_type")}
          placeholder={t("feed_filter_all_animals")}
          options={animalTypes.map((animalType) => ({
            value: animalType.id,
            label: locale === "bn" ? animalType.label_bn : animalType.label_en,
          }))}
          value={animalTypeId}
          onChange={setAnimalTypeId}
        />

        <Select
          label={t("feed_filter_incident_type")}
          placeholder={t("feed_filter_all_incident_types")}
          options={INCIDENT_TYPES.map((type) => ({
            value: type,
            label: t(INCIDENT_LABEL_KEY[type]),
          }))}
          value={incidentType}
          onChange={setIncidentType}
        />

        {viewerLocation && (
          <Select
            label={t("feed_filter_any_distance")}
            placeholder={t("feed_filter_any_distance")}
            options={RADIUS_OPTIONS_KM.map((km) => ({
              value: km,
              label: t("feed_filter_radius_km", { km }),
            }))}
            value={radiusKm}
            onChange={setRadiusKm}
          />
        )}

        <Stack direction="row" gap="2">
          <Button
            variant={!includeClosed ? "primary" : "outline"}
            onPress={() => setIncludeClosed(false)}
          >
            {t("feed_show_active")}
          </Button>
          <Button
            variant={includeClosed ? "primary" : "outline"}
            onPress={() => setIncludeClosed(true)}
          >
            {t("feed_show_closed")}
          </Button>
        </Stack>

        <Button
          variant="outline"
          loading={locating}
          onPress={handleUseLocation}
        >
          {t("feed_use_my_location")}
        </Button>

        <Stack direction="row" gap="2">
          <Button
            variant={mode === "list" ? "primary" : "outline"}
            onPress={() => setMode("list")}
          >
            {t("feed_view_list")}
          </Button>
          <Button
            variant={mode === "map" ? "primary" : "outline"}
            onPress={() => setMode("map")}
          >
            {t("feed_view_map")}
          </Button>
        </Stack>

        {error && <Text className="text-critical">{error}</Text>}

        {mode === "map" ? (
          <Stack className="h-80 w-full">
            <LocationMap markers={markers} />
          </Stack>
        ) : cases.length === 0 && !loading ? (
          <Text tone="muted">{t("feed_no_results")}</Text>
        ) : (
          <Stack gap="3">
            {cases.map((feedCase) => {
              const statusKey = STATUS_LABEL_KEY[feedCase.status];
              return (
                <RescueCaseCard
                  key={feedCase.id}
                  variant="compact"
                  thumbnailUri={thumbnails[feedCase.id]}
                  urgency={feedCase.urgency}
                  title={feedCase.title}
                  areaLabel={[feedCase.upazila_or_thana, feedCase.district]
                    .filter(Boolean)
                    .join(", ")}
                  lastUpdateLabel={new Date(
                    feedCase.updated_at,
                  ).toLocaleDateString(locale)}
                  statusLabel={
                    statusKey ? t(statusKey) : humanizeStatus(feedCase.status)
                  }
                  statusTone={caseStatusTone(feedCase.status)}
                  onPress={() => router.push(`/case/${feedCase.id}`)}
                />
              );
            })}
          </Stack>
        )}

        {mode === "list" && cases.length < totalCount && (
          <Button
            variant="outline"
            loading={loading}
            onPress={() => void loadPage(offset + PAGE_SIZE, false)}
          >
            {t("feed_load_more")}
          </Button>
        )}
      </Stack>
    </SafeAreaContainer>
  );
}
