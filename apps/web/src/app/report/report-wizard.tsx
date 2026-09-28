"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "../../lib/supabase/client";
import { draftStore } from "../../lib/draft-store";
import { dataUrlToBlob, processImageForUpload } from "../../lib/processImage";

type IncidentType = Database["public"]["Enums"]["incident_type"];
type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];
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

const URGENCY_LEVELS: UrgencyLevel[] = [
  "critical",
  "urgent",
  "support_needed",
  "adoption_community",
];

const URGENCY_LABEL_KEY: Record<UrgencyLevel, TranslationKey> = {
  critical: "urgency_critical",
  urgent: "urgency_urgent",
  support_needed: "urgency_support_needed",
  adoption_community: "urgency_adoption_community",
};

export function ReportWizard({
  animalTypes,
  userId,
}: {
  animalTypes: AnimalType[];
  userId: string;
}) {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const router = useRouter();

  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCase[]>([]);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(
    null,
  );

  // Resumes the most recently updated draft, if one exists, rather
  // than always starting fresh - CASE-001's "survives termination"
  // intent.
  useEffect(() => {
    async function loadDraft() {
      const existing = await draftStore.list();
      setDraft(existing[0] ?? createEmptyDraft(crypto.randomUUID()));
    }
    void loadDraft();
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

  async function handleUseGps() {
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void persist({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        setLocating(false);
      },
      () => {
        setError(t("form_required_field"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function checkDuplicates() {
    if (!draft?.location) return;
    const { data } = await findNearbyDuplicateCases(
      createClient(),
      draft.location,
    );
    setDuplicates(data ?? []);
  }

  async function handlePhotoSelected(file: File) {
    setProcessingPhoto(true);
    setError(null);
    try {
      const processed = await processImageForUpload(file);
      await persist({
        localMediaUris: [...(draft?.localMediaUris ?? []), processed.dataUrl],
      });
    } catch {
      setError("Could not process that photo. Try a different one.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto(index: number) {
    void persist({
      localMediaUris: (draft?.localMediaUris ?? []).filter(
        (_, i) => i !== index,
      ),
    });
  }

  async function handleSubmit() {
    if (!draft) return;
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
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("form_required_field"));
      return;
    }

    setSubmitting(true);
    const client = createClient();
    const { data: newCase, error: createError } = await createCase(
      client,
      result.data,
    );
    if (createError || !newCase) {
      setSubmitting(false);
      setError(createError?.message ?? "Could not submit the report");
      return;
    }

    // Graphic-content self-flagging UI isn't part of this flow yet - isGraphic defaults to false.
    for (const dataUrl of draft.localMediaUris ?? []) {
      const blob = await dataUrlToBlob(dataUrl);
      await uploadCaseMedia(client, {
        caseId: newCase.id,
        uploaderId: userId,
        mediaId: crypto.randomUUID(),
        fileExtension: "jpg",
        contentType: "image/jpeg",
        bytes: blob,
      });
    }

    await draftStore.delete(draft.idempotencyKey);
    setSubmitting(false);
    setSubmittedReference(newCase.public_reference);
  }

  if (!draft) {
    return null;
  }

  if (submittedReference) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-text">
          {t("report_success_heading")}
        </h1>
        <p className="text-text-muted">
          {t("report_success_message", { reference: submittedReference })}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("action_close")}
        </button>
      </main>
    );
  }

  const step = draft.currentStep;

  function goToStep(next: number) {
    void persist({ currentStep: next });
    if (next === 4) void checkDuplicates();
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <p className="text-text-muted">{t("report_step_x_of_7", { step })}</p>

      {step === 1 && (
        <Step1
          draft={draft}
          onChange={persist}
          onNext={() => goToStep(2)}
          t={t}
          animalTypes={animalTypes}
          locale={locale}
        />
      )}
      {step === 2 && (
        <Step2
          draft={draft}
          processing={processingPhoto}
          onSelect={handlePhotoSelected}
          onRemove={removePhoto}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
          t={t}
        />
      )}
      {step === 3 && (
        <Step3
          draft={draft}
          onChange={persist}
          onBack={() => goToStep(2)}
          onNext={() => goToStep(4)}
          t={t}
        />
      )}
      {step === 4 && (
        <Step4
          draft={draft}
          duplicates={duplicates}
          locating={locating}
          onUseGps={handleUseGps}
          onChange={persist}
          onBack={() => goToStep(3)}
          onNext={() => goToStep(5)}
          t={t}
        />
      )}
      {step === 5 && (
        <Step5
          draft={draft}
          onChange={persist}
          onBack={() => goToStep(4)}
          onNext={() => goToStep(6)}
          t={t}
        />
      )}
      {step === 6 && (
        <Step6 onBack={() => goToStep(5)} onNext={() => goToStep(7)} t={t} />
      )}
      {step === 7 && (
        <Step7
          draft={draft}
          submitting={submitting}
          error={error}
          onBack={() => goToStep(6)}
          onSubmit={handleSubmit}
          t={t}
          animalTypes={animalTypes}
          locale={locale}
        />
      )}
    </main>
  );
}

type T = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

function Step1({
  draft,
  onChange,
  onNext,
  t,
  animalTypes,
  locale,
}: {
  draft: CaseDraft;
  onChange: (patch: Partial<CaseDraft>) => void;
  onNext: () => void;
  t: T;
  animalTypes: AnimalType[];
  locale: "en" | "bn";
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_incident_type_heading")}
      </h1>
      <div className="flex flex-col gap-2">
        {INCIDENT_TYPES.map((incidentType) => (
          <label key={incidentType} className="flex items-center gap-2">
            <input
              type="radio"
              name="incidentType"
              checked={draft.incidentType === incidentType}
              onChange={() => onChange({ incidentType })}
            />
            <span className="text-text">
              {t(INCIDENT_LABEL_KEY[incidentType])}
            </span>
          </label>
        ))}
      </div>

      <h2 className="font-semibold text-text">{t("report_urgency_heading")}</h2>
      <div className="flex flex-col gap-2">
        {URGENCY_LEVELS.map((urgency) => (
          <label key={urgency} className="flex items-center gap-2">
            <input
              type="radio"
              name="urgency"
              checked={draft.urgency === urgency}
              onChange={() => onChange({ urgency })}
            />
            <span className="text-text">{t(URGENCY_LABEL_KEY[urgency])}</span>
          </label>
        ))}
      </div>

      <h2 className="font-semibold text-text">
        {t("report_animal_type_heading")}
      </h2>
      <div className="flex flex-col gap-2">
        {animalTypes.map((animalType) => (
          <label key={animalType.id} className="flex items-center gap-2">
            <input
              type="radio"
              name="animalType"
              checked={draft.animalTypeId === animalType.id}
              onChange={() => onChange({ animalTypeId: animalType.id })}
            />
            <span className="text-text">
              {locale === "bn" ? animalType.label_bn : animalType.label_en}
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={!draft.incidentType || !draft.urgency}
        onClick={onNext}
        className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
      >
        {t("onboarding_continue")}
      </button>
    </>
  );
}

function Step2({
  draft,
  processing,
  onSelect,
  onRemove,
  onBack,
  onNext,
  t,
}: {
  draft: CaseDraft;
  processing: boolean;
  onSelect: (file: File) => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  t: T;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_photo_heading")}
      </h1>
      <p className="text-text-muted">{t("report_photo_instructions")}</p>

      <label className="min-h-12 rounded-full border border-border px-4 py-2 text-center text-text">
        {processing ? t("report_photo_processing") : t("report_photo_add")}
        <input
          type="file"
          accept="image/*"
          disabled={processing}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.target.value = "";
          }}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {(draft.localMediaUris ?? []).map((uri, index) => (
          <div key={uri.slice(0, 32) + index} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data: URLs, not a remote asset Next's optimizer can handle */}
            <img
              src={uri}
              alt=""
              className="h-20 w-20 rounded-medium object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -right-2 -top-2 rounded-full bg-critical px-2 text-on-primary"
            >
              {t("report_photo_remove")}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("onboarding_continue")}
        </button>
      </div>
    </>
  );
}

function Step3({
  draft,
  onChange,
  onBack,
  onNext,
  t,
}: {
  draft: CaseDraft;
  onChange: (patch: Partial<CaseDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  t: T;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_condition_heading")}
      </h1>
      <textarea
        value={draft.description ?? ""}
        placeholder={t("report_condition_placeholder")}
        onChange={(event) => onChange({ description: event.target.value })}
        rows={5}
        className="rounded-md border border-border bg-surface p-4 text-text"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          disabled={!draft.description?.trim()}
          onClick={onNext}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("onboarding_continue")}
        </button>
      </div>
    </>
  );
}

function Step4({
  draft,
  duplicates,
  locating,
  onUseGps,
  onChange,
  onBack,
  onNext,
  t,
}: {
  draft: CaseDraft;
  duplicates: DuplicateCase[];
  locating: boolean;
  onUseGps: () => void;
  onChange: (patch: Partial<CaseDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  t: T;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_location_heading")}
      </h1>
      <button
        type="button"
        disabled={locating}
        onClick={onUseGps}
        className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
      >
        {t("report_location_use_gps")}
      </button>
      <p className="text-text-muted">
        {t("report_location_manual_instructions")}
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-text">{t("report_latitude_label")}</span>
        <input
          type="number"
          step="any"
          value={draft.location?.latitude ?? ""}
          onChange={(event) =>
            onChange({
              location: {
                latitude: Number(event.target.value),
                longitude: draft.location?.longitude ?? 0,
              },
            })
          }
          className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-text">{t("report_longitude_label")}</span>
        <input
          type="number"
          step="any"
          value={draft.location?.longitude ?? ""}
          onChange={(event) =>
            onChange({
              location: {
                latitude: draft.location?.latitude ?? 0,
                longitude: Number(event.target.value),
              },
            })
          }
          className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
        />
      </label>

      {duplicates.length > 0 && (
        <div className="rounded-medium border border-warning p-4">
          <p className="font-semibold text-warning">
            {t("report_duplicate_warning_heading")}
          </p>
          <p className="text-text-muted">
            {t("report_duplicate_warning_message")}
          </p>
          <ul>
            {duplicates.map((duplicate) => (
              <li key={duplicate.id} className="text-text">
                {duplicate.title} - {duplicate.public_reference}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          disabled={!draft.location}
          onClick={onNext}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("onboarding_continue")}
        </button>
      </div>
    </>
  );
}

function Step5({
  draft,
  onChange,
  onBack,
  onNext,
  t,
}: {
  draft: CaseDraft;
  onChange: (patch: Partial<CaseDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  t: T;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_landmark_heading")}
      </h1>
      <input
        type="text"
        value={draft.landmark ?? ""}
        onChange={(event) => onChange({ landmark: event.target.value })}
        className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.creatorOnSite ?? false}
          onChange={(event) =>
            onChange({ creatorOnSite: event.target.checked })
          }
        />
        <span className="text-text">{t("report_still_here_label")}</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("onboarding_continue")}
        </button>
      </div>
    </>
  );
}

function Step6({
  onBack,
  onNext,
  t,
}: {
  onBack: () => void;
  onNext: () => void;
  t: T;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_review_heading")}
      </h1>
      <p className="text-text-muted">
        {t("disclaimer_no_guaranteed_responder")}
      </p>
      <p className="text-text-muted">{t("disclaimer_urgency_not_diagnosis")}</p>
      <p className="text-text-muted">
        {t("disclaimer_volunteers_independent")}
      </p>
      <p className="text-text-muted">{t("disclaimer_contact_authorities")}</p>
      <p className="text-text-muted">{t("content_location_approximate")}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("onboarding_continue")}
        </button>
      </div>
    </>
  );
}

function Step7({
  draft,
  submitting,
  error,
  onBack,
  onSubmit,
  t,
  animalTypes,
  locale,
}: {
  draft: CaseDraft;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
  t: T;
  animalTypes: AnimalType[];
  locale: "en" | "bn";
}) {
  const animalLabel = animalTypes.find((a) => a.id === draft.animalTypeId);
  return (
    <>
      <h1 className="text-2xl font-bold text-text">
        {t("report_preview_heading")}
      </h1>
      <p className="text-text">
        {draft.incidentType && t(INCIDENT_LABEL_KEY[draft.incidentType])}
      </p>
      <p className="text-text">
        {draft.urgency && t(URGENCY_LABEL_KEY[draft.urgency])}
      </p>
      <p className="text-text">
        {animalLabel
          ? locale === "bn"
            ? animalLabel.label_bn
            : animalLabel.label_en
          : ""}
      </p>
      <p className="text-text-muted">{draft.description}</p>
      <p className="text-text-muted">{draft.landmark}</p>

      {error && <p className="text-critical">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-full border border-border px-4 py-2 text-text"
        >
          {t("report_back")}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="min-h-12 flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
        >
          {t("report_submit")}
        </button>
      </div>
    </>
  );
}
