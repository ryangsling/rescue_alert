"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createResponse,
  createComment,
  createReply,
  createCaseUpdate,
  createContentReport,
  editComment,
  editReply,
  hideComment,
  hideReply,
  updateResponseStatus,
  withdrawResponse,
  listCaseResponses,
  listCaseComments,
  listCaseUpdates,
  listCaseNeeds,
  addCaseNeed,
  removeCaseNeed,
  watchCase,
  unwatchCase,
  isWatchingCase,
  getProfileNames,
  getResponderPhone,
  getCaseExactLocation,
  listCaseMedia,
  uploadCaseMedia,
  getCaseMediaSignedUrl,
} from "@rescue-alert/api";
import {
  containsPersonalContactInfo,
  buildMentionToken,
  splitMentionSegments,
} from "@rescue-alert/validation";
import { buildExternalNavigationUrls } from "@rescue-alert/maps";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../lib/supabase/client";
import { dataUrlToBlob, processImageForUpload } from "../lib/processImage";

// Never includes `location` - authenticated has no column grant for
// it (see the rescue_cases select below), and anon has none at all.
type CaseRow = Omit<
  Database["public"]["Tables"]["rescue_cases"]["Row"],
  "location"
>;
type ResponseRow = Database["public"]["Tables"]["case_responses"]["Row"];
type NeedRow = Database["public"]["Tables"]["case_needs"]["Row"];
type UpdateRow = Database["public"]["Tables"]["case_updates"]["Row"];
type CommentRow = Database["public"]["Tables"]["case_comments"]["Row"] & {
  comment_replies: Database["public"]["Tables"]["comment_replies"]["Row"][];
};
type AssistanceType = Database["public"]["Enums"]["assistance_type"];
type ResponseStatus = Database["public"]["Enums"]["response_commitment_status"];
type ReportTargetType = Database["public"]["Enums"]["report_target_type"];

const ASSISTANCE_TYPES: AssistanceType[] = [
  "on_site_rescue",
  "transport",
  "veterinary_treatment",
  "temporary_foster",
  "shelter_coordination",
  "case_coordination",
  "financial_support",
];

const ASSISTANCE_LABEL_KEY: Record<AssistanceType, TranslationKey> = {
  on_site_rescue: "assistance_on_site_rescue",
  transport: "assistance_transport",
  veterinary_treatment: "assistance_veterinary_treatment",
  temporary_foster: "assistance_temporary_foster",
  shelter_coordination: "assistance_shelter_coordination",
  case_coordination: "assistance_case_coordination",
  financial_support: "assistance_financial_support",
};

const STATUS_LABEL_KEY: Record<CaseRow["status"], TranslationKey> = {
  draft: "status_draft",
  submitted: "status_submitted",
  under_review: "status_under_review",
  open: "status_open",
  response_committed: "status_response_committed",
  responder_en_route: "status_responder_en_route",
  animal_located: "status_animal_located",
  rescue_in_progress: "status_rescue_in_progress",
  transporting: "status_transporting",
  at_clinic_foster_shelter: "status_at_clinic_foster_shelter",
  follow_up_required: "status_follow_up_required",
  resolved: "status_resolved",
  closed: "status_closed",
  no_longer_found: "status_no_longer_found",
  duplicate: "status_duplicate",
  false_report: "status_false_report",
  spam: "status_spam",
  unsafe_or_prohibited_content: "status_unsafe_or_prohibited_content",
  cancelled_by_reporter: "status_cancelled_by_reporter",
  closed_by_moderator: "status_closed_by_moderator",
};

const CLOSED_STATUSES = new Set<CaseRow["status"]>([
  "resolved",
  "closed",
  "no_longer_found",
  "duplicate",
  "false_report",
  "spam",
  "unsafe_or_prohibited_content",
  "cancelled_by_reporter",
  "closed_by_moderator",
]);

const RESPONSE_STATUS_LABEL_KEY: Record<ResponseStatus, TranslationKey> = {
  committed: "response_status_committed",
  confirmed: "response_status_confirmed",
  completed: "response_status_completed",
  declined: "response_status_declined",
  unresponsive: "response_status_unresponsive",
  withdrawn: "response_status_withdrawn",
};

const REPORT_REASONS = [
  { value: "harassment" as const, key: "report_reason_harassment" as const },
  { value: "spam" as const, key: "report_reason_spam" as const },
  { value: "cruelty" as const, key: "report_reason_cruelty" as const },
  {
    value: "privacy_exposure" as const,
    key: "report_reason_privacy_exposure" as const,
  },
  { value: "other" as const, key: "report_reason_other" as const },
];

type ComposerTarget = "comment" | { replyTo: string } | null;
type ReportTarget = { targetType: ReportTargetType; targetId: string } | null;

function PrivacyWarning({ text, label }: { text: string; label: string }) {
  if (!containsPersonalContactInfo(text)) return null;
  return (
    <p className="rounded-md bg-warning-container px-3 py-2 text-sm text-warning">
      {label}
    </p>
  );
}

/** Part 12 case detail, web counterpart of apps/mobile's case/[id] screen - same packages/api and packages/validation calls, HTML/Tailwind instead of Rescue UI's React Native components. */
export function CaseDetail({ caseId }: { caseId: string }) {
  const supabase = createClient();
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const [userId, setUserId] = useState<string | null>(null);
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [needs, setNeeds] = useState<NeedRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [isWatching, setIsWatching] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assistanceSelected, setAssistanceSelected] = useState<
    Set<AssistanceType>
  >(new Set());
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [withdrawingResponseId, setWithdrawingResponseId] = useState<
    string | null
  >(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [editingTarget, setEditingTarget] = useState<{
    type: "comment" | "reply";
    id: string;
    body: string;
  } | null>(null);
  const [editBody, setEditBody] = useState("");
  const [responderPhones, setResponderPhones] = useState<
    Record<string, string>
  >({});
  const [exactLocation, setExactLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [composerBody, setComposerBody] = useState("");
  const [composerTarget, setComposerTarget] = useState<ComposerTarget>(null);

  const [updateBody, setUpdateBody] = useState("");
  const [updateIsPinned, setUpdateIsPinned] = useState(false);
  const [updatePhotos, setUpdatePhotos] = useState<string[]>([]);
  const [processingUpdatePhoto, setProcessingUpdatePhoto] = useState(false);
  const [updateMediaUrls, setUpdateMediaUrls] = useState<
    Record<string, string[]>
  >({});

  const isCoordinatorLike = isCreator || isCoordinator || isModerator;
  const isCaseClosed = caseRow ? CLOSED_STATUSES.has(caseRow.status) : false;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      { data: user },
      { data: caseData, error: caseError },
      { data: responseData },
      { data: needData },
      { data: commentData },
      { data: updateData },
      { data: mediaData },
    ] = await Promise.all([
      supabase.auth.getUser(),
      // Never select("*") here: rescue_cases.location (the exact
      // coordinate) is deliberately not in authenticated's column
      // grant (get_case_exact_location() is the only way to read it),
      // and anon has no grant on this table at all - see
      // fix_exact_location_column_grants.sql.
      supabase
        .from("rescue_cases")
        .select(
          "id, creator_id, public_reference, incident_type, animal_type_id, urgency, status, title, description, approximate_location, division, district, upazila_or_thana, landmark, reported_at, last_seen_at, creator_on_site, exact_location_visibility, coordinator_id, organization_id, idempotency_key, created_at, updated_at, closed_at, closure_reason",
        )
        .eq("id", caseId)
        .maybeSingle(),
      listCaseResponses(supabase, caseId),
      listCaseNeeds(supabase, caseId),
      listCaseComments(supabase, caseId),
      listCaseUpdates(supabase, caseId),
      listCaseMedia(supabase, caseId),
    ]);

    setLoading(false);

    if (caseError) {
      setError(caseError.message);
      return;
    }
    setCaseRow(caseData ?? null);
    if (!caseData) return;

    const uid = user.user?.id ?? null;
    setUserId(uid);
    setResponses(responseData ?? []);
    setNeeds(needData ?? []);
    setComments((commentData as CommentRow[] | null) ?? []);
    setUpdates(updateData ?? []);

    const mediaByUpdate = new Map<string, string[]>();
    for (const media of mediaData ?? []) {
      if (!media.update_id) continue;
      const { data: signed } = await getCaseMediaSignedUrl(
        supabase,
        media.storage_path,
        3600,
      );
      if (!signed?.signedUrl) continue;
      const existing = mediaByUpdate.get(media.update_id) ?? [];
      existing.push(signed.signedUrl);
      mediaByUpdate.set(media.update_id, existing);
    }
    setUpdateMediaUrls(Object.fromEntries(mediaByUpdate));

    if (uid) {
      const [
        { data: creator },
        { data: coordinator },
        { data: moderator },
        watching,
        { data: location },
      ] = await Promise.all([
        supabase.rpc("is_case_creator", { p_case_id: caseId }),
        supabase.rpc("is_case_coordinator", { p_case_id: caseId }),
        supabase.rpc("is_moderator_or_admin"),
        isWatchingCase(supabase, uid, caseId),
        getCaseExactLocation(supabase, caseId),
      ]);
      setIsCreator(creator ?? false);
      setIsCoordinator(coordinator ?? false);
      setIsModerator(moderator ?? false);
      setIsWatching(watching.isWatching);
      setExactLocation(location);

      // Only the creator/coordinator/moderator can ever get a
      // non-null result from get_responder_phone() - see that
      // function's own gate - so there is no point asking for
      // anyone else, or for a response that isn't accepted yet.
      if (creator || coordinator || moderator) {
        const accepted = (responseData ?? []).filter(
          (r) => r.status === "confirmed" || r.status === "completed",
        );
        const phoneEntries = await Promise.all(
          accepted.map(async (r) => {
            const { data: phone } = await getResponderPhone(supabase, r.id);
            return [r.id, phone] as [string, string | null];
          }),
        );
        setResponderPhones(
          Object.fromEntries(
            phoneEntries.filter(
              (entry): entry is [string, string] => entry[1] !== null,
            ),
          ),
        );
      } else {
        setResponderPhones({});
      }
    } else {
      setExactLocation(null);
      setResponderPhones({});
    }

    const participantIds = [
      caseData.creator_id,
      caseData.coordinator_id,
      ...(responseData ?? []).map((r) => r.responder_id),
      ...(commentData ?? []).flatMap((c: CommentRow) => [
        c.author_id,
        ...c.comment_replies.map((r) => r.author_id),
      ]),
      ...(updateData ?? []).map((u) => u.author_id),
    ].filter((v): v is string => Boolean(v));
    setProfileNames(await getProfileNames(supabase, participantIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client identity is stable per render tree, caseId is the real dependency
  }, [caseId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useEffect(() => {
    const channel = supabase
      .channel(`case-detail-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_responses",
          filter: `case_id=eq.${caseId}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_needs",
          filter: `case_id=eq.${caseId}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_comments",
          filter: `case_id=eq.${caseId}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_updates",
          filter: `case_id=eq.${caseId}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rescue_cases",
          filter: `id=eq.${caseId}`,
        },
        () => void loadAll(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client identity is stable per render tree
  }, [caseId, loadAll]);

  function insertMention(candidateId: string, name: string) {
    setComposerBody(
      (body) =>
        `${body}${body ? " " : ""}${buildMentionToken(name, candidateId)} `,
    );
  }

  async function handleSubmitResponse() {
    if (!userId || assistanceSelected.size === 0) return;
    await createResponse(supabase, userId, {
      caseId,
      assistanceTypes: [...assistanceSelected],
      availabilityNote: availabilityNote || undefined,
    });
    setAssistanceSelected(new Set());
    setAvailabilityNote("");
    await loadAll();
  }

  async function handleWithdraw() {
    if (!withdrawingResponseId || !withdrawReason.trim()) return;
    await withdrawResponse(supabase, {
      responseId: withdrawingResponseId,
      reason: withdrawReason.trim(),
    });
    setWithdrawingResponseId(null);
    setWithdrawReason("");
    await loadAll();
  }

  async function handleCoordinatorStatus(
    responseId: string,
    status: "confirmed" | "completed" | "declined" | "unresponsive",
  ) {
    await updateResponseStatus(supabase, { responseId, status });
    await loadAll();
  }

  async function handleSubmitComposer() {
    if (!userId || !composerTarget || !composerBody.trim()) return;
    if (composerTarget === "comment") {
      await createComment(supabase, userId, {
        caseId,
        body: composerBody.trim(),
      });
    } else {
      await createReply(supabase, userId, {
        commentId: composerTarget.replyTo,
        body: composerBody.trim(),
      });
    }
    setComposerTarget(null);
    setComposerBody("");
    await loadAll();
  }

  async function handleUpdatePhotoSelected(file: File) {
    setProcessingUpdatePhoto(true);
    try {
      const processed = await processImageForUpload(file);
      setUpdatePhotos((current) => [...current, processed.dataUrl]);
    } catch {
      // Picking/processing failure just leaves the photo list
      // unchanged - the composer's submit button stays available.
    } finally {
      setProcessingUpdatePhoto(false);
    }
  }

  function handleRemoveUpdatePhoto(index: number) {
    setUpdatePhotos((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmitUpdate() {
    if (!userId || !updateBody.trim()) return;
    const { data: newUpdate } = await createCaseUpdate(supabase, userId, {
      caseId,
      body: updateBody.trim(),
      isPinned: updateIsPinned,
    });
    if (newUpdate) {
      for (const dataUrl of updatePhotos) {
        const blob = await dataUrlToBlob(dataUrl);
        await uploadCaseMedia(supabase, {
          caseId,
          uploaderId: userId,
          mediaId: crypto.randomUUID(),
          fileExtension: "jpg",
          contentType: "image/jpeg",
          bytes: new Uint8Array(await blob.arrayBuffer()),
          updateId: newUpdate.id,
        });
      }
    }
    setUpdateBody("");
    setUpdateIsPinned(false);
    setUpdatePhotos([]);
    await loadAll();
  }

  async function handleToggleWatch() {
    if (!userId) return;
    if (isWatching) await unwatchCase(supabase, userId, caseId);
    else await watchCase(supabase, userId, caseId);
    setIsWatching(!isWatching);
  }

  async function handleSaveEdit() {
    if (!editingTarget || !editBody.trim()) return;
    if (editingTarget.type === "comment") {
      await editComment(supabase, editingTarget.id, editBody.trim());
    } else {
      await editReply(supabase, editingTarget.id, editBody.trim());
    }
    setEditingTarget(null);
    setEditBody("");
    await loadAll();
  }

  async function handleSubmitReport() {
    if (!userId || !reportTarget || !reportReason) return;
    await createContentReport(supabase, userId, {
      targetType: reportTarget.targetType,
      targetId: reportTarget.targetId,
      reason: reportReason as Database["public"]["Enums"]["report_reason"],
      details: reportDetails || undefined,
    });
    setReportTarget(null);
    setReportReason(null);
    setReportDetails("");
  }

  async function handleToggleNeed(type: AssistanceType) {
    const existing = needs.find((n) => n.need_type === type);
    if (existing) await removeCaseNeed(supabase, caseId, type);
    else await addCaseNeed(supabase, caseId, type);
    await loadAll();
  }

  if (loading) {
    return <p className="p-6 text-text">{t("case_detail_loading")}</p>;
  }
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-critical">
          {t("case_detail_error_heading")}
        </h1>
        <p className="text-text-muted">{t("case_detail_error_message")}</p>
      </div>
    );
  }
  if (!caseRow) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-text">
          {t("case_detail_not_found_heading")}
        </h1>
        <p className="text-text-muted">{t("case_detail_not_found_message")}</p>
      </div>
    );
  }

  const myResponse = responses.find((r) => r.responder_id === userId);
  const mentionCandidates = Object.entries(profileNames).filter(
    ([pid]) => pid !== userId,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{caseRow.title}</h1>
        <p className="text-text-muted">
          {[caseRow.upazila_or_thana, caseRow.district]
            .filter(Boolean)
            .join(", ")}
        </p>
        <span className="inline-block rounded-full bg-support-container px-3 py-1 text-sm text-support">
          {t(STATUS_LABEL_KEY[caseRow.status])}
        </span>
      </div>

      {isCaseClosed ? (
        <p className="rounded-md bg-neutral-container px-3 py-2 text-neutral">
          {t("case_detail_closed_notice")}
        </p>
      ) : null}

      <p className="text-text">{caseRow.description}</p>

      {exactLocation ? (
        <a
          href={
            buildExternalNavigationUrls(exactLocation, caseRow.title)
              .webFallback
          }
          target="_blank"
          rel="noreferrer"
          className="min-h-11 self-start rounded-full border border-border px-4 py-2 text-text"
        >
          {t("view_exact_location_action")}
        </a>
      ) : null}

      <button
        type="button"
        onClick={handleToggleWatch}
        className="min-h-11 self-start rounded-full border border-border px-4 py-2 text-text"
      >
        {isWatching ? t("unwatch_action") : t("watch_action")}
      </button>

      {!isCaseClosed && !myResponse && userId ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-4">
          <h2 className="text-lg font-semibold text-text">
            {t("response_assistance_types_heading")}
          </h2>
          {ASSISTANCE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assistanceSelected.has(type)}
                onChange={(event) =>
                  setAssistanceSelected((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(type);
                    else next.delete(type);
                    return next;
                  })
                }
              />
              <span className="text-text">{t(ASSISTANCE_LABEL_KEY[type])}</span>
            </label>
          ))}
          <textarea
            value={availabilityNote}
            onChange={(event) => setAvailabilityNote(event.target.value)}
            placeholder={t("response_availability_note_label")}
            rows={2}
            className="rounded-md border border-border bg-surface p-3 text-text"
          />
          <p className="text-sm text-text-muted">
            {t("disclaimer_no_ownership")}
          </p>
          <button
            type="button"
            disabled={assistanceSelected.size === 0}
            onClick={handleSubmitResponse}
            className="min-h-11 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
          >
            {t("action_i_can_help")}
          </button>
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">
          {t("section_responders_heading")}
        </h2>
        {responses.map((response) => (
          <div
            key={response.id}
            className="rounded-md border border-border bg-surface p-3"
          >
            <p className="font-medium text-text">
              {profileNames[response.responder_id] ?? response.responder_id}
            </p>
            <p className="text-text-muted">
              {response.assistance_types.join(", ")}
            </p>
            {response.availability_note ? (
              <p className="text-text-muted">{response.availability_note}</p>
            ) : null}
            {responderPhones[response.id] ? (
              <p className="text-text">{responderPhones[response.id]}</p>
            ) : null}
            <span className="inline-block rounded-full bg-support-container px-2 py-0.5 text-sm text-support">
              {t(RESPONSE_STATUS_LABEL_KEY[response.status])}
            </span>
            {isCoordinatorLike && response.responder_id !== userId ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCoordinatorStatus(response.id, "confirmed")
                  }
                  className="min-h-9 rounded-full border border-border px-3 py-1 text-sm text-text"
                >
                  {t("coordinator_confirm_action")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCoordinatorStatus(response.id, "completed")
                  }
                  className="min-h-9 rounded-full border border-border px-3 py-1 text-sm text-text"
                >
                  {t("coordinator_complete_action")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCoordinatorStatus(response.id, "declined")
                  }
                  className="min-h-9 rounded-full border border-border px-3 py-1 text-sm text-text"
                >
                  {t("coordinator_decline_action")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCoordinatorStatus(response.id, "unresponsive")
                  }
                  className="min-h-9 rounded-full border border-border px-3 py-1 text-sm text-text"
                >
                  {t("coordinator_mark_unresponsive_action")}
                </button>
              </div>
            ) : response.responder_id === userId &&
              (response.status === "committed" ||
                response.status === "confirmed") ? (
              <button
                type="button"
                onClick={() => setWithdrawingResponseId(response.id)}
                className="mt-2 min-h-9 rounded-full border border-critical px-3 py-1 text-sm text-critical"
              >
                {t("response_withdraw_action")}
              </button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">
          {t("section_needs_heading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {needs.map((need) => (
            <button
              key={need.need_type}
              type="button"
              disabled={!isCoordinatorLike}
              onClick={() => handleToggleNeed(need.need_type)}
              className={[
                "min-h-9 rounded-full border px-3 py-1 text-sm",
                need.is_fulfilled
                  ? "border-border text-text-muted line-through"
                  : "border-support text-support",
              ].join(" ")}
            >
              {t(ASSISTANCE_LABEL_KEY[need.need_type])}
            </button>
          ))}
        </div>
        {isCoordinatorLike ? (
          <div className="flex flex-wrap gap-2">
            {ASSISTANCE_TYPES.filter(
              (type) => !needs.some((n) => n.need_type === type),
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleToggleNeed(type)}
                className="min-h-9 rounded-full border border-border px-3 py-1 text-sm text-text"
              >
                + {t(ASSISTANCE_LABEL_KEY[type])}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">
          {t("section_updates_heading")}
        </h2>
        {updates.map((update) => (
          <div
            key={update.id}
            className="rounded-md border-l-4 border-l-primary bg-primary-container p-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-on-primary-container">
                {profileNames[update.author_id] ?? update.author_id}
              </span>
              <span className="text-sm text-on-primary-container">
                {update.author_id === caseRow.creator_id
                  ? t("role_label_creator")
                  : update.author_id === caseRow.coordinator_id
                    ? t("role_label_coordinator")
                    : t("role_label_participant")}
              </span>
              {update.is_pinned ? (
                <span className="text-sm text-on-primary-container">
                  {t("update_pinned_label")}
                </span>
              ) : null}
            </div>
            <p className="text-on-primary-container">{update.body}</p>
            {(updateMediaUrls[update.id] ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {updateMediaUrls[update.id]?.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs, not a remote asset Next's optimizer can handle
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-medium object-cover"
                  />
                ))}
              </div>
            ) : null}
            <p className="text-sm text-on-primary-container">
              {new Date(update.created_at).toLocaleString(locale)}
            </p>
          </div>
        ))}
        {isCoordinatorLike && !isCaseClosed ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={updateBody}
              onChange={(event) => setUpdateBody(event.target.value)}
              placeholder={t("update_composer_label")}
              rows={3}
              className="rounded-md border border-border bg-surface p-3 text-text"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={updateIsPinned}
                onChange={(event) => setUpdateIsPinned(event.target.checked)}
              />
              <span className="text-text">{t("update_pin_label")}</span>
            </label>
            <label className="min-h-11 self-start rounded-full border border-border px-4 py-2 text-center text-text">
              {processingUpdatePhoto
                ? t("report_photo_processing")
                : t("report_photo_add")}
              <input
                type="file"
                accept="image/*"
                disabled={processingUpdatePhoto}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpdatePhotoSelected(file);
                  event.target.value = "";
                }}
              />
            </label>
            {updatePhotos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {updatePhotos.map((dataUrl, index) => (
                  <div key={dataUrl.slice(0, 32) + index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data: URLs, not a remote asset Next's optimizer can handle */}
                    <img
                      src={dataUrl}
                      alt=""
                      className="h-20 w-20 rounded-medium object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveUpdatePhoto(index)}
                      className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-scrim text-on-primary"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <PrivacyWarning
              text={updateBody}
              label={t("privacy_warning_message")}
            />
            <button
              type="button"
              disabled={!updateBody.trim()}
              onClick={handleSubmitUpdate}
              className="min-h-11 self-start rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
            >
              {t("update_submit")}
            </button>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">
          {t("section_comments_heading")}
        </h2>
        {comments.map((comment) => (
          <div key={comment.id} className="flex flex-col gap-2">
            <div className="rounded-md bg-surface p-3">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-text">
                  {profileNames[comment.author_id] ?? comment.author_id}
                </span>
                <span className="text-sm text-text-muted">
                  {new Date(comment.created_at).toLocaleString(locale)}
                </span>
                {comment.edited_at ? (
                  <span className="text-sm text-text-muted">(edited)</span>
                ) : null}
              </div>
              {comment.is_hidden ? (
                <p className="text-text-muted">
                  {t("comment_hidden_placeholder")}
                </p>
              ) : (
                <p className="text-text">
                  {splitMentionSegments(comment.body).map((segment, index) =>
                    segment.type === "mention" ? (
                      <span
                        key={index}
                        className="rounded bg-primary-container px-1 text-primary"
                      >
                        @{segment.text}
                      </span>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    ),
                  )}
                </p>
              )}
              <div className="mt-1 flex gap-3 text-sm">
                {!isCaseClosed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerTarget({ replyTo: comment.id });
                      setComposerBody("");
                    }}
                    className="text-primary"
                  >
                    {t("comment_reply_label")}
                  </button>
                ) : null}
                {comment.author_id === userId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTarget({
                        type: "comment",
                        id: comment.id,
                        body: comment.body,
                      });
                      setEditBody(comment.body);
                    }}
                    className="text-text-muted"
                  >
                    {t("comment_edit_action")}
                  </button>
                ) : null}
                {comment.author_id === userId || isModerator ? (
                  <button
                    type="button"
                    onClick={() =>
                      hideComment(supabase, comment.id).then(loadAll)
                    }
                    className="text-text-muted"
                  >
                    {t("comment_hide_action")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setReportTarget({
                      targetType: "comment",
                      targetId: comment.id,
                    })
                  }
                  className="text-text-muted"
                >
                  {t("comment_report_action")}
                </button>
              </div>
            </div>

            {comment.comment_replies.length > 0 ? (
              <div className="ml-6 flex flex-col gap-2">
                {comment.comment_replies.map((reply) => (
                  <div key={reply.id} className="rounded-md bg-surface p-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-text">
                        {profileNames[reply.author_id] ?? reply.author_id}
                      </span>
                      <span className="text-sm text-text-muted">
                        {new Date(reply.created_at).toLocaleString(locale)}
                      </span>
                    </div>
                    {reply.is_hidden ? (
                      <p className="text-text-muted">
                        {t("comment_hidden_placeholder")}
                      </p>
                    ) : (
                      <p className="text-text">
                        {splitMentionSegments(reply.body).map(
                          (segment, index) =>
                            segment.type === "mention" ? (
                              <span
                                key={index}
                                className="rounded bg-primary-container px-1 text-primary"
                              >
                                @{segment.text}
                              </span>
                            ) : (
                              <span key={index}>{segment.text}</span>
                            ),
                        )}
                      </p>
                    )}
                    <div className="mt-1 flex gap-3 text-sm">
                      {reply.author_id === userId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTarget({
                              type: "reply",
                              id: reply.id,
                              body: reply.body,
                            });
                            setEditBody(reply.body);
                          }}
                          className="text-text-muted"
                        >
                          {t("comment_edit_action")}
                        </button>
                      ) : null}
                      {reply.author_id === userId || isModerator ? (
                        <button
                          type="button"
                          onClick={() =>
                            hideReply(supabase, reply.id).then(loadAll)
                          }
                          className="text-text-muted"
                        >
                          {t("comment_hide_action")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            targetType: "reply",
                            targetId: reply.id,
                          })
                        }
                        className="text-text-muted"
                      >
                        {t("comment_report_action")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {composerTarget &&
            composerTarget !== "comment" &&
            composerTarget.replyTo === comment.id ? (
              <div className="ml-6 flex flex-col gap-2">
                <textarea
                  value={composerBody}
                  onChange={(event) => setComposerBody(event.target.value)}
                  placeholder={t("comment_reply_composer_label")}
                  rows={2}
                  className="rounded-md border border-border bg-surface p-3 text-text"
                />
                <PrivacyWarning
                  text={composerBody}
                  label={t("privacy_warning_message")}
                />
                {mentionCandidates.length > 0 ? (
                  <select
                    onChange={(event) => {
                      const picked = mentionCandidates.find(
                        ([id]) => id === event.target.value,
                      );
                      if (picked) insertMention(picked[0], picked[1]);
                      event.target.value = "";
                    }}
                    defaultValue=""
                    className="min-h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
                  >
                    <option value="">{t("comment_mention_action")}</option>
                    {mentionCandidates.map(([pid, name]) => (
                      <option key={pid} value={pid}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button
                  type="button"
                  disabled={!composerBody.trim()}
                  onClick={handleSubmitComposer}
                  className="min-h-9 self-start rounded-full bg-primary px-3 py-1 text-sm font-semibold text-on-primary disabled:opacity-50"
                >
                  {t("comment_reply_submit")}
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {!isCaseClosed ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={composerTarget === "comment" ? composerBody : ""}
              onChange={(event) => {
                setComposerTarget("comment");
                setComposerBody(event.target.value);
              }}
              placeholder={t("comment_composer_label")}
              rows={2}
              className="rounded-md border border-border bg-surface p-3 text-text"
            />
            {composerTarget === "comment" ? (
              <PrivacyWarning
                text={composerBody}
                label={t("privacy_warning_message")}
              />
            ) : null}
            {mentionCandidates.length > 0 ? (
              <select
                onChange={(event) => {
                  setComposerTarget("comment");
                  const picked = mentionCandidates.find(
                    ([id]) => id === event.target.value,
                  );
                  if (picked) insertMention(picked[0], picked[1]);
                  event.target.value = "";
                }}
                defaultValue=""
                className="min-h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
              >
                <option value="">{t("comment_mention_action")}</option>
                {mentionCandidates.map(([pid, name]) => (
                  <option key={pid} value={pid}>
                    {name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              disabled={composerTarget !== "comment" || !composerBody.trim()}
              onClick={handleSubmitComposer}
              className="min-h-11 self-start rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
            >
              {t("comment_submit")}
            </button>
          </div>
        ) : null}
      </section>

      {withdrawingResponseId ? (
        <div className="fixed inset-0 flex items-center justify-center bg-scrim p-6">
          <div className="w-full max-w-sm rounded-md bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-text">
              {t("response_withdraw_title")}
            </h3>
            <textarea
              value={withdrawReason}
              onChange={(event) => setWithdrawReason(event.target.value)}
              placeholder={t("response_withdraw_reason_label")}
              rows={3}
              className="mb-4 w-full rounded-md border border-border bg-surface p-3 text-text"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWithdrawingResponseId(null)}
                className="min-h-10 rounded-full px-4 py-2 text-text"
              >
                {t("action_cancel")}
              </button>
              <button
                type="button"
                disabled={!withdrawReason.trim()}
                onClick={handleWithdraw}
                className="min-h-10 rounded-full bg-critical px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
              >
                {t("response_withdraw_action")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportTarget ? (
        <div className="fixed inset-0 flex items-center justify-center bg-scrim p-6">
          <div className="w-full max-w-sm rounded-md bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-text">
              {t("content_report_title")}
            </h3>
            <fieldset className="mb-4 flex flex-col gap-2">
              <legend className="text-text">
                {t("content_report_reason_label")}
              </legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reportReason === r.value}
                    onChange={() => setReportReason(r.value)}
                  />
                  <span className="text-text">{t(r.key)}</span>
                </label>
              ))}
            </fieldset>
            <textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              placeholder={t("content_report_details_label")}
              rows={2}
              className="mb-4 w-full rounded-md border border-border bg-surface p-3 text-text"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="min-h-10 rounded-full px-4 py-2 text-text"
              >
                {t("action_cancel")}
              </button>
              <button
                type="button"
                disabled={!reportReason}
                onClick={handleSubmitReport}
                className="min-h-10 rounded-full bg-critical px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
              >
                {t("content_report_submit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingTarget ? (
        <div className="fixed inset-0 flex items-center justify-center bg-scrim p-6">
          <div className="w-full max-w-sm rounded-md bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-text">
              {t(
                editingTarget.type === "comment"
                  ? "comment_edit_title"
                  : "reply_edit_title",
              )}
            </h3>
            <textarea
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              rows={3}
              className="mb-4 w-full rounded-md border border-border bg-surface p-3 text-text"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="min-h-10 rounded-full px-4 py-2 text-text"
              >
                {t("action_cancel")}
              </button>
              <button
                type="button"
                disabled={!editBody.trim()}
                onClick={handleSaveEdit}
                className="min-h-10 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
              >
                {t("action_save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
