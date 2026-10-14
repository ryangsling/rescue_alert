import { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { buildExternalNavigationUrls } from "@rescue-alert/maps";
import {
  Banner,
  Button,
  CaseHeader,
  Checkbox,
  CommentThread,
  EditTextDialog,
  LoadingState,
  MediaPicker,
  MentionPicker,
  NeedsSelector,
  ReportDialog,
  ResponderCard,
  SafeAreaContainer,
  SafetyCallout,
  StateView,
  Stack,
  Text,
  TextArea,
  TextField,
  Timeline,
  WithdrawDialog,
  type MediaItem,
  type StatusChipTone,
} from "@rescue-alert/ui";
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
  listCaseMedia,
  addCaseNeed,
  removeCaseNeed,
  watchCase,
  unwatchCase,
  isWatchingCase,
  getProfileNames,
  getResponderPhone,
  getCaseExactLocation,
  getCaseMediaSignedUrl,
  uploadCaseMedia,
  reopenCase,
} from "@rescue-alert/api";
import {
  containsPersonalContactInfo,
  buildMentionToken,
  splitMentionSegments,
} from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../../supabase-client";
import { recordCaseView } from "../../recentlyViewedStore";
import {
  processImageForUpload,
  type ProcessedImage,
} from "../../lib/processImage";

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

const ASSISTANCE_TYPES: AssistanceType[] = [
  "on_site_rescue",
  "transport",
  "veterinary_treatment",
  "temporary_foster",
  "shelter_coordination",
  "case_coordination",
  "financial_support",
];

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

function caseStatusTone(status: CaseRow["status"]): StatusChipTone {
  if (CLOSED_STATUSES.has(status)) return "success";
  if (status === "open") return "neutral";
  return "support";
}

const RESPONSE_STATUS_LABEL_KEY: Record<ResponseStatus, TranslationKey> = {
  committed: "response_status_committed",
  confirmed: "response_status_confirmed",
  completed: "response_status_completed",
  declined: "response_status_declined",
  unresponsive: "response_status_unresponsive",
  withdrawn: "response_status_withdrawn",
};

function responseStatusTone(status: ResponseStatus): StatusChipTone {
  if (status === "confirmed" || status === "completed") return "success";
  if (
    status === "declined" ||
    status === "unresponsive" ||
    status === "withdrawn"
  )
    return "neutral";
  return "support";
}

const ASSISTANCE_LABEL_KEY: Record<AssistanceType, TranslationKey> = {
  on_site_rescue: "assistance_on_site_rescue",
  transport: "assistance_transport",
  veterinary_treatment: "assistance_veterinary_treatment",
  temporary_foster: "assistance_temporary_foster",
  shelter_coordination: "assistance_shelter_coordination",
  case_coordination: "assistance_case_coordination",
  financial_support: "assistance_financial_support",
};

type HazardType = Database["public"]["Enums"]["hazard_type"];
const HAZARD_LABEL_KEY: Record<HazardType, TranslationKey> = {
  traffic: "hazard_traffic",
  violence: "hazard_violence",
  electrical: "hazard_electrical",
  water: "hazard_water",
  height: "hazard_height",
  other: "hazard_other",
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

/**
 * Part 12 case detail - the screen every push notification's
 * rescuealert://case/<id> deep link resolves to (Part 11), and the
 * first place responses, comments, official updates, and the needs
 * board are wired to real data rather than presentational-only
 * components.
 */
export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const [responseError, setResponseError] = useState<string | null>(null);

  const [assistanceSelected, setAssistanceSelected] = useState<
    Set<AssistanceType>
  >(new Set());
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [withdrawingResponseId, setWithdrawingResponseId] = useState<
    string | null
  >(null);
  const [reportTarget, setReportTarget] = useState<{
    targetType: "comment" | "reply" | "media";
    targetId: string;
  } | null>(null);
  const [editingTarget, setEditingTarget] = useState<{
    type: "comment" | "reply";
    id: string;
    body: string;
  } | null>(null);

  const [composerBody, setComposerBody] = useState("");
  const [composerTarget, setComposerTarget] = useState<ComposerTarget>(null);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);

  const [updateBody, setUpdateBody] = useState("");
  const [updateIsPinned, setUpdateIsPinned] = useState(false);
  const [updatePhotos, setUpdatePhotos] = useState<ProcessedImage[]>([]);
  const [processingUpdatePhoto, setProcessingUpdatePhoto] = useState(false);
  const [updateMediaUrls, setUpdateMediaUrls] = useState<
    Record<string, string[]>
  >({});

  const [responderPhones, setResponderPhones] = useState<
    Record<string, string>
  >({});
  const [exactLocation, setExactLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const isCoordinatorLike = isCreator || isCoordinator || isModerator;
  const isCaseClosed = caseRow ? CLOSED_STATUSES.has(caseRow.status) : false;

  const loadAll = useCallback(async () => {
    if (!id) return;
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
          "id, creator_id, public_reference, incident_type, animal_type_id, urgency, status, title, description, approximate_location, division, district, upazila_or_thana, landmark, reported_at, last_seen_at, creator_on_site, exact_location_visibility, coordinator_id, organization_id, idempotency_key, created_at, updated_at, closed_at, closure_reason, merged_into_case_id, hazard_flags",
        )
        .eq("id", id)
        .maybeSingle(),
      listCaseResponses(supabase, id),
      listCaseNeeds(supabase, id),
      listCaseComments(supabase, id),
      listCaseUpdates(supabase, id),
      listCaseMedia(supabase, id),
    ]);

    setLoading(false);

    if (caseError) {
      setError(caseError.message);
      return;
    }
    setCaseRow(caseData ?? null);
    if (!caseData) return;

    void recordCaseView({
      id: caseData.id,
      publicReference: caseData.public_reference,
      title: caseData.title,
      urgency: caseData.urgency,
    });

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
        supabase.rpc("is_case_creator", { p_case_id: id }),
        supabase.rpc("is_case_coordinator", { p_case_id: id }),
        supabase.rpc("is_moderator_or_admin"),
        isWatchingCase(supabase, uid, id),
        getCaseExactLocation(supabase, id),
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
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  // Bounded realtime: one channel, filtered to this case only, torn
  // down on unmount - PRD's "bounded subscriptions" requirement.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`case-detail-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_responses",
          filter: `case_id=eq.${id}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_needs",
          filter: `case_id=eq.${id}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_comments",
          filter: `case_id=eq.${id}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_updates",
          filter: `case_id=eq.${id}`,
        },
        () => void loadAll(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rescue_cases",
          filter: `id=eq.${id}`,
        },
        () => void loadAll(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, loadAll]);

  function openComposer(target: ComposerTarget) {
    setComposerTarget(target);
    setComposerBody("");
  }

  function insertMention(candidateId: string) {
    const name = profileNames[candidateId] ?? "";
    setComposerBody(
      (body) =>
        `${body}${body ? " " : ""}${buildMentionToken(name, candidateId)} `,
    );
    setMentionPickerOpen(false);
  }

  async function handleSubmitResponse() {
    if (!id || !userId || assistanceSelected.size === 0) return;
    setResponseError(null);
    const { error: responseSubmitError } = await createResponse(
      supabase,
      userId,
      {
        caseId: id,
        assistanceTypes: [...assistanceSelected],
        availabilityNote: availabilityNote || undefined,
      },
    );
    if (responseSubmitError) {
      setResponseError(
        responseSubmitError.code === "23505"
          ? t("response_already_committed_error")
          : t("response_submit_error"),
      );
      return;
    }
    setAssistanceSelected(new Set());
    setAvailabilityNote("");
    await loadAll();
  }

  async function handleWithdraw(reason: string) {
    if (!withdrawingResponseId) return;
    await withdrawResponse(supabase, {
      responseId: withdrawingResponseId,
      reason,
    });
    setWithdrawingResponseId(null);
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
    if (!id || !userId || !composerTarget || !composerBody.trim()) return;
    if (composerTarget === "comment") {
      await createComment(supabase, userId, {
        caseId: id,
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

  async function handleAddUpdatePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    setProcessingUpdatePhoto(true);
    try {
      const processed = await processImageForUpload(result.assets[0].uri);
      setUpdatePhotos((current) => [...current, processed]);
    } catch {
      // Picking/processing failure just leaves the photo list
      // unchanged - the composer's submit button stays available.
    } finally {
      setProcessingUpdatePhoto(false);
    }
  }

  function handleRemoveUpdatePhoto(uri: string) {
    setUpdatePhotos((current) => current.filter((p) => p.uri !== uri));
  }

  async function handleSubmitUpdate() {
    if (!id || !userId || !updateBody.trim()) return;
    const { data: newUpdate } = await createCaseUpdate(supabase, userId, {
      caseId: id,
      body: updateBody.trim(),
      isPinned: updateIsPinned,
    });
    if (newUpdate) {
      for (const photo of updatePhotos) {
        await uploadCaseMedia(supabase, {
          caseId: id,
          uploaderId: userId,
          mediaId: crypto.randomUUID(),
          fileExtension: "jpg",
          contentType: photo.contentType,
          bytes: photo.bytes,
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
    if (!id || !userId) return;
    if (isWatching) await unwatchCase(supabase, userId, id);
    else await watchCase(supabase, userId, id);
    setIsWatching(!isWatching);
  }

  async function handleReopen() {
    if (!id || !userId) return;
    await reopenCase(supabase, userId, id, reopenReason.trim() || undefined);
    setReopenReason("");
    await loadAll();
  }

  async function handleSubmitReport(reason: string, details: string) {
    if (!userId || !reportTarget) return;
    await createContentReport(supabase, userId, {
      targetType: reportTarget.targetType,
      targetId: reportTarget.targetId,
      reason: reason as Database["public"]["Enums"]["report_reason"],
      details: details || undefined,
    });
    setReportTarget(null);
  }

  async function handleToggleNeed(type: AssistanceType) {
    if (!id) return;
    const existing = needs.find((n) => n.need_type === type);
    if (existing) await removeCaseNeed(supabase, id, type);
    else await addCaseNeed(supabase, id, type);
    await loadAll();
  }

  /** Soft-hide only (COMM: deletion preserves moderation evidence) - the author or a moderator may do this; inline editing is not built in this pass. */
  async function handleHideComment(commentId: string) {
    await hideComment(supabase, commentId);
    await loadAll();
  }

  async function handleHideReply(replyId: string) {
    await hideReply(supabase, replyId);
    await loadAll();
  }

  async function handleSaveEdit(body: string) {
    if (!editingTarget) return;
    if (editingTarget.type === "comment") {
      await editComment(supabase, editingTarget.id, body);
    } else {
      await editReply(supabase, editingTarget.id, body);
    }
    setEditingTarget(null);
    await loadAll();
  }

  if (loading) {
    return (
      <SafeAreaContainer>
        <LoadingState message={t("case_detail_loading")} />
      </SafeAreaContainer>
    );
  }

  if (error) {
    return (
      <SafeAreaContainer>
        <StateView
          variant="error"
          heading={t("case_detail_error_heading")}
          message={t("case_detail_error_message")}
          actionLabel={t("action_retry")}
          onAction={loadAll}
        />
      </SafeAreaContainer>
    );
  }

  if (!caseRow) {
    return (
      <SafeAreaContainer>
        <StateView
          variant="empty"
          heading={t("case_detail_not_found_heading")}
          message={t("case_detail_not_found_message")}
        />
      </SafeAreaContainer>
    );
  }

  const myResponse = responses.find((r) => r.responder_id === userId);
  const mentionCandidates = Object.entries(profileNames)
    .filter(([pid]) => pid !== userId)
    .map(([pid, name]) => ({ id: pid, name }));

  return (
    <SafeAreaContainer>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <CaseHeader
          urgency={caseRow.urgency}
          title={caseRow.title}
          areaLabel={[caseRow.upazila_or_thana, caseRow.district]
            .filter(Boolean)
            .join(", ")}
          lastUpdateLabel={new Date(caseRow.updated_at).toLocaleString(locale)}
          statusLabel={t(STATUS_LABEL_KEY[caseRow.status])}
          statusTone={caseStatusTone(caseRow.status)}
          onReport={() =>
            setReportTarget({ targetType: "comment", targetId: caseRow.id })
          }
        />

        {caseRow.hazard_flags.length > 0 ? (
          <Stack gap="1">
            <Text variant="titleMedium">{t("case_hazards_heading")}</Text>
            <Text tone="muted">
              {caseRow.hazard_flags
                .map((hazard) => t(HAZARD_LABEL_KEY[hazard]))
                .join(", ")}
            </Text>
          </Stack>
        ) : null}

        {(caseRow.hazard_flags.length > 0 ||
          caseRow.incident_type === "abuse_or_cruelty_suspected") && (
          <SafetyCallout
            tone="warning"
            heading={t("safety_response_callout_heading")}
            instructions={[
              t("safety_rabies_guidance"),
              t("safety_bite_guidance"),
            ]}
          />
        )}

        {isCaseClosed ? (
          <Banner tone="neutral" message={t("case_detail_closed_notice")} />
        ) : null}

        {isCoordinatorLike && !isCaseClosed ? (
          <Button
            variant="outline"
            onPress={() => router.push(`/case/${id}/close`)}
          >
            {t("case_close_action")}
          </Button>
        ) : null}

        {isModerator && isCaseClosed ? (
          <Stack gap="2">
            <TextField
              label={t("case_reopen_reason_label")}
              value={reopenReason}
              onChangeText={setReopenReason}
            />
            <Button variant="outline" onPress={handleReopen}>
              {t("case_reopen_action")}
            </Button>
          </Stack>
        ) : null}

        <Text variant="bodyMedium">{caseRow.description}</Text>

        {exactLocation ? (
          <Button
            variant="outline"
            onPress={() =>
              Linking.openURL(
                buildExternalNavigationUrls(exactLocation, caseRow.title)
                  .webFallback,
              )
            }
          >
            {t("view_exact_location_action")}
          </Button>
        ) : null}

        <Button
          variant={isWatching ? "outline" : "tonal"}
          onPress={handleToggleWatch}
        >
          {isWatching ? t("unwatch_action") : t("watch_action")}
        </Button>

        {!isCaseClosed && !myResponse && userId ? (
          <Stack gap="2">
            <Text variant="titleMedium">
              {t("response_assistance_types_heading")}
            </Text>
            {ASSISTANCE_TYPES.map((type) => (
              <Checkbox
                key={type}
                label={t(ASSISTANCE_LABEL_KEY[type])}
                checked={assistanceSelected.has(type)}
                onChange={(checked) =>
                  setAssistanceSelected((current) => {
                    const next = new Set(current);
                    if (checked) next.add(type);
                    else next.delete(type);
                    return next;
                  })
                }
              />
            ))}
            <TextArea
              label={t("response_availability_note_label")}
              value={availabilityNote}
              onChangeText={setAvailabilityNote}
              rows={2}
            />
            <Text variant="caption" tone="muted">
              {t("disclaimer_no_ownership")}
            </Text>
            {responseError && (
              <Text accessibilityRole="alert" className="text-critical">
                {responseError}
              </Text>
            )}
            <Button
              disabled={assistanceSelected.size === 0}
              onPress={handleSubmitResponse}
            >
              {t("action_i_can_help")}
            </Button>
          </Stack>
        ) : null}

        <Text variant="titleMedium">{t("section_responders_heading")}</Text>
        {responses.map((response) => (
          <ResponderCard
            key={response.id}
            name={profileNames[response.responder_id] ?? response.responder_id}
            assistanceTypeLabel={response.assistance_types.join(", ")}
            availabilityLabel={response.availability_note ?? undefined}
            statusLabel={t(RESPONSE_STATUS_LABEL_KEY[response.status])}
            statusTone={responseStatusTone(response.status)}
            isAuthorizedViewer={responderPhones[response.id] !== undefined}
            phoneNumber={responderPhones[response.id]}
            coordinatorActions={
              isCoordinatorLike && response.responder_id !== userId
                ? [
                    {
                      label: t("coordinator_confirm_action"),
                      onPress: () =>
                        handleCoordinatorStatus(response.id, "confirmed"),
                    },
                    {
                      label: t("coordinator_complete_action"),
                      onPress: () =>
                        handleCoordinatorStatus(response.id, "completed"),
                    },
                    {
                      label: t("coordinator_decline_action"),
                      onPress: () =>
                        handleCoordinatorStatus(response.id, "declined"),
                    },
                    {
                      label: t("coordinator_mark_unresponsive_action"),
                      onPress: () =>
                        handleCoordinatorStatus(response.id, "unresponsive"),
                    },
                  ]
                : response.responder_id === userId &&
                    (response.status === "committed" ||
                      response.status === "confirmed")
                  ? [
                      {
                        label: t("response_withdraw_action"),
                        onPress: () => setWithdrawingResponseId(response.id),
                      },
                    ]
                  : undefined
            }
          />
        ))}

        <Text variant="titleMedium">{t("section_needs_heading")}</Text>
        <NeedsSelector
          needs={needs.map((n) => ({
            type: n.need_type,
            isFulfilled: n.is_fulfilled,
          }))}
          onToggle={isCoordinatorLike ? handleToggleNeed : undefined}
        />
        {isCoordinatorLike ? (
          <Stack direction="row" gap="2" className="flex-wrap">
            {ASSISTANCE_TYPES.filter(
              (type) => !needs.some((n) => n.need_type === type),
            ).map((type) => (
              <Button
                key={type}
                variant="outline"
                onPress={() => handleToggleNeed(type)}
              >
                {t(ASSISTANCE_LABEL_KEY[type])}
              </Button>
            ))}
          </Stack>
        ) : null}

        <Text variant="titleMedium">{t("section_updates_heading")}</Text>
        <Timeline
          updates={updates.map((u) => ({
            actorName: profileNames[u.author_id] ?? u.author_id,
            actorRole:
              u.author_id === caseRow.creator_id
                ? t("role_label_creator")
                : u.author_id === caseRow.coordinator_id
                  ? t("role_label_coordinator")
                  : t("role_label_participant"),
            timestampLabel: new Date(u.created_at).toLocaleString(locale),
            updateType: t("update_type_generic"),
            body: u.body,
            isPinned: u.is_pinned,
            pinnedLabel: u.is_pinned ? t("update_pinned_label") : undefined,
            mediaUris: updateMediaUrls[u.id],
          }))}
        />
        {isCoordinatorLike && !isCaseClosed ? (
          <Stack gap="2">
            <TextArea
              label={t("update_composer_label")}
              value={updateBody}
              onChangeText={setUpdateBody}
              rows={3}
            />
            <Checkbox
              label={t("update_pin_label")}
              checked={updateIsPinned}
              onChange={setUpdateIsPinned}
            />
            {processingUpdatePhoto ? (
              <Text tone="muted">{t("report_photo_processing")}</Text>
            ) : null}
            <MediaPicker
              items={updatePhotos.map((photo): MediaItem => ({
                id: photo.uri,
                uri: photo.uri,
                state: "uploaded",
              }))}
              onAdd={handleAddUpdatePhoto}
              onRetry={() => undefined}
              onRemove={handleRemoveUpdatePhoto}
            />
            {containsPersonalContactInfo(updateBody) ? (
              <Banner tone="warning" message={t("privacy_warning_message")} />
            ) : null}
            <Button disabled={!updateBody.trim()} onPress={handleSubmitUpdate}>
              {t("update_submit")}
            </Button>
          </Stack>
        ) : null}

        <Text variant="titleMedium">{t("section_comments_heading")}</Text>
        <CommentThread
          replyLabel={t("comment_reply_label")}
          items={comments.map((c) => ({
            id: c.id,
            comment: {
              authorName: profileNames[c.author_id] ?? c.author_id,
              timestampLabel: new Date(c.created_at).toLocaleString(locale),
              segments: splitMentionSegments(c.body),
              isEdited: Boolean(c.edited_at),
              isHidden: c.is_hidden,
              hiddenPlaceholderText: t("comment_hidden_placeholder"),
              actions: [
                ...(c.author_id === userId
                  ? [
                      {
                        label: t("comment_edit_action"),
                        onSelect: () =>
                          setEditingTarget({
                            type: "comment" as const,
                            id: c.id,
                            body: c.body,
                          }),
                      },
                    ]
                  : []),
                ...(c.author_id === userId || isModerator
                  ? [
                      {
                        label: t("comment_hide_action"),
                        onSelect: () => handleHideComment(c.id),
                      },
                    ]
                  : []),
                {
                  label: t("comment_report_action"),
                  onSelect: () =>
                    setReportTarget({ targetType: "comment", targetId: c.id }),
                },
              ],
            },
            replies: c.comment_replies.map((r) => ({
              id: r.id,
              authorName: profileNames[r.author_id] ?? r.author_id,
              timestampLabel: new Date(r.created_at).toLocaleString(locale),
              segments: splitMentionSegments(r.body),
              isEdited: Boolean(r.edited_at),
              isHidden: r.is_hidden,
              hiddenPlaceholderText: t("comment_hidden_placeholder"),
              actions: [
                ...(r.author_id === userId
                  ? [
                      {
                        label: t("comment_edit_action"),
                        onSelect: () =>
                          setEditingTarget({
                            type: "reply" as const,
                            id: r.id,
                            body: r.body,
                          }),
                      },
                    ]
                  : []),
                ...(r.author_id === userId || isModerator
                  ? [
                      {
                        label: t("comment_hide_action"),
                        onSelect: () => handleHideReply(r.id),
                      },
                    ]
                  : []),
                {
                  label: t("comment_report_action"),
                  onSelect: () =>
                    setReportTarget({ targetType: "reply", targetId: r.id }),
                },
              ],
            })),
          }))}
          onReplyPress={
            isCaseClosed
              ? undefined
              : (commentId) => openComposer({ replyTo: commentId })
          }
          replyComposer={
            composerTarget && composerTarget !== "comment"
              ? {
                  commentId: composerTarget.replyTo,
                  node: (
                    <Stack gap="2">
                      <TextArea
                        label={t("comment_reply_composer_label")}
                        value={composerBody}
                        onChangeText={setComposerBody}
                        rows={2}
                      />
                      {containsPersonalContactInfo(composerBody) ? (
                        <Banner
                          tone="warning"
                          message={t("privacy_warning_message")}
                        />
                      ) : null}
                      <Button
                        variant="text"
                        onPress={() => setMentionPickerOpen(true)}
                      >
                        {t("comment_mention_action")}
                      </Button>
                      <Button
                        disabled={!composerBody.trim()}
                        onPress={handleSubmitComposer}
                      >
                        {t("comment_reply_submit")}
                      </Button>
                    </Stack>
                  ),
                }
              : null
          }
        />

        {!isCaseClosed ? (
          <Stack gap="2">
            <TextArea
              label={t("comment_composer_label")}
              value={composerTarget === "comment" ? composerBody : ""}
              onChangeText={(text) => {
                setComposerTarget("comment");
                setComposerBody(text);
              }}
              rows={2}
            />
            {composerTarget === "comment" &&
            containsPersonalContactInfo(composerBody) ? (
              <Banner tone="warning" message={t("privacy_warning_message")} />
            ) : null}
            <Button
              variant="text"
              onPress={() => {
                setComposerTarget("comment");
                setMentionPickerOpen(true);
              }}
            >
              {t("comment_mention_action")}
            </Button>
            <Button
              disabled={composerTarget !== "comment" || !composerBody.trim()}
              onPress={handleSubmitComposer}
            >
              {t("comment_submit")}
            </Button>
          </Stack>
        ) : null}
      </ScrollView>

      <MentionPicker
        visible={mentionPickerOpen}
        onRequestClose={() => setMentionPickerOpen(false)}
        candidates={mentionCandidates}
        onPick={(candidate) => insertMention(candidate.id)}
      />

      <WithdrawDialog
        visible={withdrawingResponseId !== null}
        onRequestClose={() => setWithdrawingResponseId(null)}
        onConfirm={handleWithdraw}
        title={t("response_withdraw_title")}
        reasonLabel={t("response_withdraw_reason_label")}
        cancelLabel={t("action_cancel")}
        confirmLabel={t("response_withdraw_action")}
      />

      <ReportDialog
        visible={reportTarget !== null}
        onRequestClose={() => setReportTarget(null)}
        reasonOptions={REPORT_REASONS.map((r) => ({
          value: r.value,
          label: t(r.key),
        }))}
        onConfirm={handleSubmitReport}
        title={t("content_report_title")}
        reasonGroupLabel={t("content_report_reason_label")}
        detailsLabel={t("content_report_details_label")}
        cancelLabel={t("action_cancel")}
        confirmLabel={t("content_report_submit")}
      />

      {editingTarget ? (
        <EditTextDialog
          key={editingTarget.id}
          visible
          onRequestClose={() => setEditingTarget(null)}
          onConfirm={handleSaveEdit}
          initialValue={editingTarget.body}
          title={t(
            editingTarget.type === "comment"
              ? "comment_edit_title"
              : "reply_edit_title",
          )}
          bodyLabel={t("comment_composer_label")}
          cancelLabel={t("action_cancel")}
          confirmLabel={t("action_save")}
        />
      ) : null}
    </SafeAreaContainer>
  );
}
