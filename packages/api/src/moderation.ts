import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  IssueAccountRestrictionInput,
  MergeDuplicateCasesInput,
  RedactCaseSensitiveInfoInput,
  CorrectCaseStatusInput,
  CreateModerationAppealInput,
  ReviewModerationAppealInput,
  AlertEscalationStepInput,
  AnimalTypeInput,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;
type ContentReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

// --- Reported content queue (MOD-001..003) ---

export async function listContentReports(
  client: Client,
  status?: ContentReportStatus,
) {
  let query = client
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: true });
  if (status) query = query.eq("status", status);
  return query;
}

export async function updateContentReportStatus(
  client: Client,
  reportId: string,
  status: ContentReportStatus,
) {
  return client
    .from("content_reports")
    .update({ status })
    .eq("id", reportId)
    .select()
    .single();
}

/** MOD-003. Moderator-initiated hides, audited via moderation_actions -
 * distinct from comment.ts's hideComment/hideReply, which is the
 * author retracting their own content and is not an auditable
 * moderation action. */
export async function moderationSetCommentHidden(
  client: Client,
  commentId: string,
  hidden: boolean,
  reason: string,
) {
  return client.rpc("moderation_set_comment_hidden", {
    p_comment_id: commentId,
    p_hidden: hidden,
    p_reason: reason,
  });
}

export async function moderationSetReplyHidden(
  client: Client,
  replyId: string,
  hidden: boolean,
  reason: string,
) {
  return client.rpc("moderation_set_reply_hidden", {
    p_reply_id: replyId,
    p_hidden: hidden,
    p_reason: reason,
  });
}

export async function moderationSetMediaHidden(
  client: Client,
  mediaId: string,
  hidden: boolean,
  reason: string,
) {
  return client.rpc("moderation_set_media_hidden", {
    p_media_id: mediaId,
    p_hidden: hidden,
    p_reason: reason,
  });
}

// --- Critical queue ---

const LIVE_CASE_STATUSES = [
  "open",
  "response_committed",
  "responder_en_route",
  "animal_located",
  "rescue_in_progress",
  "transporting",
  "at_clinic_foster_shelter",
  "follow_up_required",
] as const;

export async function listCriticalCaseQueue(client: Client) {
  return client
    .from("rescue_cases")
    .select("*")
    .in("urgency", ["critical", "urgent"])
    .in("status", LIVE_CASE_STATUSES)
    .order("urgency", { ascending: true })
    .order("reported_at", { ascending: true });
}

/** Cases that have reached no responder at all since opening. */
export async function listUnansweredCriticalCases(client: Client) {
  return client
    .from("rescue_cases")
    .select("*")
    .in("urgency", ["critical", "urgent"])
    .eq("status", "open")
    .order("reported_at", { ascending: true });
}

// --- Duplicate merge, redaction, status correction (MOD-004, MOD-005, MOD-010) ---

export async function mergeDuplicateCases(
  client: Client,
  input: MergeDuplicateCasesInput,
) {
  return client.rpc("merge_duplicate_cases", {
    p_source_case_id: input.sourceCaseId,
    p_target_case_id: input.targetCaseId,
    p_reason: input.reason,
  });
}

export async function redactCaseSensitiveInfo(
  client: Client,
  input: RedactCaseSensitiveInfoInput,
) {
  return client.rpc("redact_case_sensitive_info", {
    p_case_id: input.caseId,
    p_reason: input.reason,
  });
}

export async function correctCaseStatus(
  client: Client,
  actorId: string,
  input: CorrectCaseStatusInput,
) {
  return client.rpc("transition_case_status", {
    p_case_id: input.caseId,
    p_new_status: input.newStatus,
    p_actor_id: actorId,
    p_reason: input.reason,
  });
}

// --- Account restrictions and appeals (MOD-006, MOD-008) ---

export async function issueAccountRestriction(
  client: Client,
  input: IssueAccountRestrictionInput,
) {
  return client.rpc("issue_account_restriction", {
    p_user_id: input.userId,
    p_restriction_type: input.restrictionType,
    p_reason: input.reason,
  });
}

export async function liftAccountRestriction(
  client: Client,
  restrictionId: string,
  reason: string,
) {
  return client.rpc("lift_account_restriction", {
    p_restriction_id: restrictionId,
    p_reason: reason,
  });
}

export async function listAccountRestrictions(client: Client, userId?: string) {
  let query = client
    .from("account_restrictions")
    .select("*")
    .order("issued_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  return query;
}

export async function createModerationAppeal(
  client: Client,
  appellantId: string,
  input: CreateModerationAppealInput,
) {
  return client
    .from("moderation_appeals")
    .insert({
      restriction_id: input.restrictionId,
      appellant_id: appellantId,
      statement: input.statement,
    })
    .select()
    .single();
}

export async function listModerationAppeals(client: Client) {
  return client
    .from("moderation_appeals")
    .select("*")
    .order("created_at", { ascending: true });
}

export async function reviewModerationAppeal(
  client: Client,
  moderatorId: string,
  input: ReviewModerationAppealInput,
) {
  return client
    .from("moderation_appeals")
    .update({
      status: input.status,
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
      decision_reason: input.decisionReason,
    })
    .eq("id", input.appealId)
    .select()
    .single();
}

// --- Audit log viewer (MOD-007) ---

export async function listModerationActions(client: Client) {
  return client
    .from("moderation_actions")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function listAuditLogs(client: Client) {
  return client
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });
}

// --- Configurable alert radii (PRD 24) ---

export async function listAlertEscalationSteps(client: Client) {
  return client
    .from("alert_escalation_steps")
    .select("*")
    .order("urgency", { ascending: true })
    .order("step", { ascending: true });
}

export async function upsertAlertEscalationStep(
  client: Client,
  input: AlertEscalationStepInput,
) {
  return client
    .from("alert_escalation_steps")
    .upsert({
      urgency: input.urgency,
      step: input.step,
      radius_km: input.radiusKm,
      after_minutes: input.afterMinutes,
    })
    .select()
    .single();
}

export async function deleteAlertEscalationStep(
  client: Client,
  urgency: "critical" | "urgent",
  step: number,
) {
  return client
    .from("alert_escalation_steps")
    .delete()
    .eq("urgency", urgency)
    .eq("step", step);
}

// --- বাংলা/English system content (PRD 24, animal_types is already
// admin-configurable per Part 1 - see animal_types_admin_write) ---

export async function listAllAnimalTypes(client: Client) {
  return client
    .from("animal_types")
    .select("*")
    .order("sort_order", { ascending: true });
}

export async function upsertAnimalType(client: Client, input: AnimalTypeInput) {
  return client
    .from("animal_types")
    .upsert(
      {
        slug: input.slug,
        label_en: input.labelEn,
        label_bn: input.labelBn,
        is_active: input.isActive,
        sort_order: input.sortOrder,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
}
