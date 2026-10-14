import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Button,
  Checkbox,
  DraftIndicator,
  MediaPicker,
  RadioGroup,
  SafeAreaContainer,
  SafetyCallout,
  Select,
  Stack,
  Text,
  TextArea,
  TextField,
  UrgencySelector,
} from "@rescue-alert/ui";
import type { MediaItem } from "@rescue-alert/ui";
import {
  createCase,
  findNearbyDuplicateCases,
  uploadCaseMedia,
} from "@rescue-alert/api";
import { createCaseSchema } from "@rescue-alert/validation";
import { createEmptyDraft, type CaseDraft } from "@rescue-alert/drafts";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../supabase-client";
import { draftStore } from "../draft-store";
import {
  processImageForUpload,
  readProcessedImageBytes,
} from "../lib/processImage";

type IncidentType = Database["public"]["Enums"]["incident_type"];
type HazardType = Database["public"]["Enums"]["hazard_type"];
type AnimalType = {
  id: string;
  slug: string;
  label_en: string;
  label_bn: string;
};
type DuplicateCase = {
  id: string;
  public_reference: string;
  title: string;
  distance_meters: number;
};

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

const HAZARD_TYPES: HazardType[] = [
  "traffic",
  "violence",
  "electrical",
  "water",
  "height",
  "other",
];

const HAZARD_LABEL_KEY: Record<HazardType, TranslationKey> = {
  traffic: "hazard_traffic",
  violence: "hazard_violence",
  electrical: "hazard_electrical",
  water: "hazard_water",
  height: "hazard_height",
  other: "hazard_other",
};

type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

/**
 * Mirrors apps/web/src/app/report/report-wizard.tsx's seven steps
 * (DESIGN.md 14.3). "Adjust on map" is a LocationField affordance the
 * web wizard does not offer either - Part 9 wires the real
 * interactive map on both platforms, so it is disclosed as deferred
 * here via an inline message rather than a functioning picker.
 *
 * No simulator/device is available in this environment (same
 * disclosed limitation as every other mobile screen this session):
 * this screen is verified by typecheck, lint and the workspace Jest
 * config, not by an on-device run of the camera/GPS/upload paths.
 */
export default function ReportScreen() {
  const { locale } = useLocale();
  const t: T = (key, params) => translate(locale, key, params);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCase[]>([]);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(
    null,
  );
  const [createdCase, setCreatedCase] = useState<{
    id: string;
    public_reference: string;
  } | null>(null);
  const [failedPhotoUris, setFailedPhotoUris] = useState<string[]>([]);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);

      const { data: types } = await supabase
        .from("animal_types")
        .select("id, slug, label_en, label_bn")
        .eq("is_active", true)
        .order("sort_order");
      setAnimalTypes(types ?? []);

      const existing = await draftStore.list();
      setDraft(existing[0] ?? createEmptyDraft(crypto.randomUUID()));
    }
    void load();
  }, []);

  async function persist(patch: Partial<CaseDraft>) {
    if (!draft) return;
    const updated: CaseDraft = {
      ...draft,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    await draftStore.save(updated);
  }

  async function checkDuplicates() {
    if (!draft?.location) return;
    const { data } = await findNearbyDuplicateCases(supabase, draft.location);
    setDuplicates(data ?? []);
  }

  async function handleUseGps() {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(t("form_required_field"));
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      await persist({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
    } catch {
      setError(t("form_required_field"));
    } finally {
      setLocating(false);
    }
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError(t("form_required_field"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    setProcessingPhoto(true);
    setError(null);
    try {
      const processed = await processImageForUpload(result.assets[0].uri);
      await persist({
        localMediaUris: [...(draft?.localMediaUris ?? []), processed.uri],
      });
    } catch {
      setError(t("photo_process_error"));
    } finally {
      setProcessingPhoto(false);
    }
  }

  function handleRemovePhoto(uri: string) {
    void persist({
      localMediaUris: (draft?.localMediaUris ?? []).filter((u) => u !== uri),
    });
  }

  async function handleSubmit() {
    if (!draft || !userId) return;
    setError(null);

    const result = createCaseSchema.safeParse({
      idempotencyKey: draft.idempotencyKey,
      incidentType: draft.incidentType,
      urgency: draft.urgency,
      animalTypeId: draft.animalTypeId,
      description: draft.description,
      location: draft.location,
      landmark: draft.landmark,
      division: draft.division,
      district: draft.district,
      upazilaOrThana: draft.upazilaOrThana,
      creatorOnSite: draft.creatorOnSite ?? false,
      lastSeenAt: draft.lastSeenAt,
      hazardFlags: draft.hazardFlags ?? [],
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("form_required_field"));
      return;
    }

    setSubmitting(true);
    const { data: newCase, error: createError } = await createCase(
      supabase,
      result.data,
    );
    if (createError || !newCase) {
      setSubmitting(false);
      setError(t("report_submit_error"));
      return;
    }

    const failed = await uploadPhotos(newCase.id, draft.localMediaUris ?? []);
    setSubmitting(false);
    if (failed.length > 0) {
      setCreatedCase(newCase);
      setFailedPhotoUris(failed);
      setPhotoUploadError(t("photo_upload_error"));
      return;
    }

    await draftStore.delete(draft.idempotencyKey);
    setSubmittedReference(newCase.public_reference);
  }

  /** Attempts every uri in order; returns the ones that failed so the
   * caller can offer a retry without re-uploading what already
   * succeeded. Graphic-content self-flagging UI isn't part of this
   * flow yet - isGraphic defaults to false. */
  async function uploadPhotos(
    caseId: string,
    uris: string[],
  ): Promise<string[]> {
    if (!userId) return uris;
    const failed: string[] = [];
    for (const uri of uris) {
      const bytes = await readProcessedImageBytes(uri);
      const { error: uploadError } = await uploadCaseMedia(supabase, {
        caseId,
        uploaderId: userId,
        mediaId: crypto.randomUUID(),
        fileExtension: "jpg",
        contentType: "image/jpeg",
        bytes,
      });
      if (uploadError) failed.push(uri);
    }
    return failed;
  }

  async function handleRetryPhotos() {
    if (!createdCase) return;
    setSubmitting(true);
    const failed = await uploadPhotos(createdCase.id, failedPhotoUris);
    setSubmitting(false);
    setFailedPhotoUris(failed);
    if (failed.length > 0) return;
    setPhotoUploadError(null);
    if (draft) await draftStore.delete(draft.idempotencyKey);
    setSubmittedReference(createdCase.public_reference);
  }

  async function handleContinueWithoutPhotos() {
    if (!createdCase) return;
    if (draft) await draftStore.delete(draft.idempotencyKey);
    setPhotoUploadError(null);
    setSubmittedReference(createdCase.public_reference);
  }

  if (!draft) return null;

  if (submittedReference) {
    return (
      <SafeAreaContainer>
        <Stack align="center" justify="center" gap="4" className="flex-1 p-8">
          <Text variant="heading1">{t("report_success_heading")}</Text>
          <Text tone="muted">
            {t("report_success_message", { reference: submittedReference })}
          </Text>
          <Button variant="primary" onPress={() => router.replace("/")}>
            {t("action_close")}
          </Button>
        </Stack>
      </SafeAreaContainer>
    );
  }

  if (photoUploadError) {
    return (
      <SafeAreaContainer>
        <Stack gap="4" className="flex-1 p-6">
          <Text accessibilityRole="alert" className="text-critical">
            {photoUploadError}
          </Text>
          <Button
            variant="primary"
            loading={submitting}
            onPress={handleRetryPhotos}
          >
            {t("photo_retry_action")}
          </Button>
          <Button variant="outline" onPress={handleContinueWithoutPhotos}>
            {t("report_submit")}
          </Button>
        </Stack>
      </SafeAreaContainer>
    );
  }

  const step = draft.currentStep;
  function goToStep(next: number) {
    void persist({ currentStep: next });
    if (next === 4) void checkDuplicates();
  }

  const mediaItems: MediaItem[] = (draft.localMediaUris ?? []).map((uri) => ({
    id: uri,
    uri,
    state: "uploaded",
  }));

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text tone="muted">{t("report_step_x_of_7", { step })}</Text>
        <DraftIndicator
          state={submitting ? "syncing" : error ? "failed" : "pending"}
          label={t(
            submitting
              ? "draft_status_syncing"
              : error
                ? "draft_status_failed"
                : "draft_status_pending",
          )}
        />

        {step === 1 && (
          <Stack gap="4">
            <RadioGroup
              label={t("report_incident_type_heading")}
              options={INCIDENT_TYPES.map((incidentType) => ({
                value: incidentType,
                label: t(INCIDENT_LABEL_KEY[incidentType]),
              }))}
              value={draft.incidentType ?? null}
              onChange={(incidentType) => persist({ incidentType })}
            />
            <Text variant="heading2">{t("report_urgency_heading")}</Text>
            <UrgencySelector
              value={draft.urgency ?? null}
              onChange={(urgency) => persist({ urgency })}
            />
            <Select
              label={t("report_animal_type_heading")}
              options={animalTypes.map((animalType) => ({
                value: animalType.id,
                label:
                  locale === "bn" ? animalType.label_bn : animalType.label_en,
              }))}
              value={draft.animalTypeId ?? null}
              onChange={(animalTypeId) => persist({ animalTypeId })}
            />
            <Button
              variant="primary"
              disabled={!draft.incidentType || !draft.urgency}
              onPress={() => goToStep(2)}
            >
              {t("onboarding_continue")}
            </Button>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap="4">
            <Text variant="heading1">{t("report_photo_heading")}</Text>
            <Text tone="muted">{t("report_photo_instructions")}</Text>
            {processingPhoto ? (
              <Text tone="muted">{t("report_photo_processing")}</Text>
            ) : null}
            <MediaPicker
              items={mediaItems}
              onAdd={handleAddPhoto}
              onRetry={() => undefined}
              onRemove={handleRemovePhoto}
            />
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(1)}>
                {t("report_back")}
              </Button>
              <Button variant="primary" onPress={() => goToStep(3)}>
                {t("onboarding_continue")}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 3 && (
          <Stack gap="4">
            <TextArea
              label={t("report_condition_heading")}
              value={draft.description ?? ""}
              onChangeText={(value) => persist({ description: value })}
              placeholder={t("report_condition_placeholder")}
              rows={5}
            />
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(2)}>
                {t("report_back")}
              </Button>
              <Button
                variant="primary"
                disabled={!draft.description?.trim()}
                onPress={() => goToStep(4)}
              >
                {t("onboarding_continue")}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 4 && (
          <Stack gap="4">
            <Text variant="heading1">{t("report_location_heading")}</Text>
            <Button
              variant="primary"
              disabled={locating}
              onPress={handleUseGps}
            >
              {t("report_location_use_gps")}
            </Button>
            <Text tone="muted">{t("report_location_manual_instructions")}</Text>
            <TextField
              label={t("report_latitude_label")}
              value={draft.location?.latitude?.toString() ?? ""}
              onChangeText={(value) =>
                persist({
                  location: {
                    latitude: Number(value) || 0,
                    longitude: draft.location?.longitude ?? 0,
                  },
                })
              }
              keyboardType="numeric"
            />
            <TextField
              label={t("report_longitude_label")}
              value={draft.location?.longitude?.toString() ?? ""}
              onChangeText={(value) =>
                persist({
                  location: {
                    latitude: draft.location?.latitude ?? 0,
                    longitude: Number(value) || 0,
                  },
                })
              }
              keyboardType="numeric"
            />
            {duplicates.length > 0 && (
              <Stack gap="1">
                <Text className="text-warning">
                  {t("report_duplicate_warning_heading")}
                </Text>
                <Text tone="muted">
                  {t("report_duplicate_warning_message")}
                </Text>
                {duplicates.map((duplicate) => (
                  <Text key={duplicate.id}>
                    {duplicate.title} - {duplicate.public_reference}
                  </Text>
                ))}
              </Stack>
            )}
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(3)}>
                {t("report_back")}
              </Button>
              <Button
                variant="primary"
                disabled={!draft.location}
                onPress={() => goToStep(5)}
              >
                {t("onboarding_continue")}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 5 && (
          <Stack gap="4">
            <TextField
              label={t("report_landmark_heading")}
              value={draft.landmark ?? ""}
              onChangeText={(value) => persist({ landmark: value })}
            />
            <Checkbox
              label={t("report_still_here_label")}
              checked={draft.creatorOnSite ?? false}
              onChange={(checked) => persist({ creatorOnSite: checked })}
            />
            <Text variant="titleMedium">{t("report_hazards_heading")}</Text>
            {HAZARD_TYPES.map((hazard) => (
              <Checkbox
                key={hazard}
                label={t(HAZARD_LABEL_KEY[hazard])}
                checked={(draft.hazardFlags ?? []).includes(hazard)}
                onChange={(checked) => {
                  const current = new Set(draft.hazardFlags ?? []);
                  if (checked) current.add(hazard);
                  else current.delete(hazard);
                  persist({ hazardFlags: Array.from(current) });
                }}
              />
            ))}
            {(draft.hazardFlags?.length ?? 0) > 0 && (
              <SafetyCallout
                tone="warning"
                heading={t("safety_rabies_heading")}
                instructions={[
                  t("safety_rabies_guidance"),
                  t("safety_bite_guidance"),
                ]}
              />
            )}
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(4)}>
                {t("report_back")}
              </Button>
              <Button variant="primary" onPress={() => goToStep(6)}>
                {t("onboarding_continue")}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 6 && (
          <Stack gap="4">
            <Text variant="heading1">{t("report_review_heading")}</Text>
            <Text tone="muted">{t("disclaimer_no_guaranteed_responder")}</Text>
            <Text tone="muted">{t("disclaimer_urgency_not_diagnosis")}</Text>
            <Text tone="muted">{t("disclaimer_volunteers_independent")}</Text>
            <Text tone="muted">{t("disclaimer_contact_authorities")}</Text>
            <Text tone="muted">{t("content_location_approximate")}</Text>
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(5)}>
                {t("report_back")}
              </Button>
              <Button variant="primary" onPress={() => goToStep(7)}>
                {t("onboarding_continue")}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 7 && (
          <Stack gap="4">
            <Text variant="heading1">{t("report_preview_heading")}</Text>
            <Text>
              {draft.incidentType && t(INCIDENT_LABEL_KEY[draft.incidentType])}
            </Text>
            <Text tone="muted">{draft.description}</Text>
            <Text tone="muted">{draft.landmark}</Text>
            {error && (
              <Text accessibilityRole="alert" className="text-critical">
                {error}
              </Text>
            )}
            <Stack direction="row" gap="2">
              <Button variant="outline" onPress={() => goToStep(6)}>
                {t("report_back")}
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                onPress={handleSubmit}
              >
                {t("report_submit")}
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </SafeAreaContainer>
  );
}
