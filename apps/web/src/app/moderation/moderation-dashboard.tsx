"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listCriticalCaseQueue,
  listUnansweredCriticalCases,
  listContentReports,
  updateContentReportStatus,
  moderationSetCommentHidden,
  moderationSetReplyHidden,
  moderationSetMediaHidden,
  mergeDuplicateCases,
  redactCaseSensitiveInfo,
  correctCaseStatus,
  issueAccountRestriction,
  liftAccountRestriction,
  listAccountRestrictions,
  listModerationAppeals,
  reviewModerationAppeal,
  listModerationActions,
  listAuditLogs,
  listAlertEscalationSteps,
  upsertAlertEscalationStep,
  listAllAnimalTypes,
  upsertAnimalType,
} from "@rescue-alert/api";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../../lib/supabase/client";

type T = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => string;

type RescueCaseRow = Database["public"]["Tables"]["rescue_cases"]["Row"];
type ContentReportRow = Database["public"]["Tables"]["content_reports"]["Row"];
type AccountRestrictionRow =
  Database["public"]["Tables"]["account_restrictions"]["Row"];
type ModerationAppealRow =
  Database["public"]["Tables"]["moderation_appeals"]["Row"];
type ModerationActionRow =
  Database["public"]["Tables"]["moderation_actions"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type AlertEscalationStepRow =
  Database["public"]["Tables"]["alert_escalation_steps"]["Row"];
type AnimalTypeRow = Database["public"]["Tables"]["animal_types"]["Row"];
type AccountRestrictionType =
  Database["public"]["Enums"]["account_restriction_type"];

type Tab =
  "queue" | "reports" | "restrictions" | "appeals" | "audit" | "settings";

// A single "type a reason, then confirm" control - every destructive
// moderation action in this dashboard requires one (MOD-007's reason
// field is NOT NULL on moderation_actions).
function ReasonAction({
  label,
  onConfirm,
  t,
}: {
  label: string;
  onConfirm: (reason: string) => Promise<void>;
  t: T;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("moderation_reason_required_label")}
      />
      <button
        type="button"
        disabled={busy || !reason.trim()}
        onClick={async () => {
          setBusy(true);
          await onConfirm(reason.trim());
          setBusy(false);
          setReason("");
        }}
      >
        {label}
      </button>
    </span>
  );
}

export function ModerationDashboard({
  userId,
  isAdministrator,
}: {
  userId: string;
  isAdministrator: boolean;
}) {
  const { locale } = useLocale();
  const t: T = (key, params) => translate(locale, key, params);
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("queue");

  // --- Critical queue ---
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [queueCases, setQueueCases] = useState<RescueCaseRow[]>([]);

  const loadQueue = useCallback(async () => {
    const { data } = unansweredOnly
      ? await listUnansweredCriticalCases(supabase)
      : await listCriticalCaseQueue(supabase);
    setQueueCases(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unansweredOnly]);

  useEffect(() => {
    if (tab !== "queue") return;
    void Promise.resolve().then(() => loadQueue());
  }, [tab, loadQueue]);

  // --- Reported content ---
  const [reports, setReports] = useState<ContentReportRow[]>([]);
  const loadReports = useCallback(async () => {
    const { data } = await listContentReports(supabase);
    setReports(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tab !== "reports") return;
    void Promise.resolve().then(() => loadReports());
  }, [tab, loadReports]);

  async function hideReportedTarget(
    report: ContentReportRow,
    hidden: boolean,
    reason: string,
  ) {
    if (report.target_type === "comment") {
      await moderationSetCommentHidden(
        supabase,
        report.target_id,
        hidden,
        reason,
      );
    } else if (report.target_type === "reply") {
      await moderationSetReplyHidden(
        supabase,
        report.target_id,
        hidden,
        reason,
      );
    } else if (report.target_type === "media") {
      await moderationSetMediaHidden(
        supabase,
        report.target_id,
        hidden,
        reason,
      );
    }
  }

  // --- Case actions: merge, redact, status correction ---
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [redactCaseId, setRedactCaseId] = useState("");
  const [correctCaseId, setCorrectCaseId] = useState("");
  const [correctStatus, setCorrectStatus] = useState<
    Database["public"]["Enums"]["case_status"]
  >("closed_by_moderator");

  // --- Account restrictions ---
  const [restrictions, setRestrictions] = useState<AccountRestrictionRow[]>([]);
  const loadRestrictions = useCallback(async () => {
    const { data } = await listAccountRestrictions(supabase);
    setRestrictions(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tab !== "restrictions") return;
    void Promise.resolve().then(() => loadRestrictions());
  }, [tab, loadRestrictions]);

  const [newRestrictionUserId, setNewRestrictionUserId] = useState("");
  const [newRestrictionType, setNewRestrictionType] =
    useState<AccountRestrictionType>("warning");

  // --- Appeals ---
  const [appeals, setAppeals] = useState<ModerationAppealRow[]>([]);
  const loadAppeals = useCallback(async () => {
    const { data } = await listModerationAppeals(supabase);
    setAppeals(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tab !== "appeals") return;
    void Promise.resolve().then(() => loadAppeals());
  }, [tab, loadAppeals]);

  // --- Audit log ---
  const [auditTab, setAuditTab] = useState<"actions" | "logs">("actions");
  const [moderationActions, setModerationActions] = useState<
    ModerationActionRow[]
  >([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  useEffect(() => {
    if (tab !== "audit") return;
    if (auditTab === "actions") {
      listModerationActions(supabase).then(({ data }) =>
        setModerationActions(data ?? []),
      );
    } else {
      listAuditLogs(supabase).then(({ data }) => setAuditLogs(data ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, auditTab]);

  // --- Settings: escalation steps + animal types (administrator only) ---
  const [steps, setSteps] = useState<AlertEscalationStepRow[]>([]);
  const [animalTypes, setAnimalTypes] = useState<AnimalTypeRow[]>([]);
  useEffect(() => {
    if (tab !== "settings" || !isAdministrator) return;
    listAlertEscalationSteps(supabase).then(({ data }) => setSteps(data ?? []));
    listAllAnimalTypes(supabase).then(({ data }) => setAnimalTypes(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAdministrator]);

  const [stepUrgency, setStepUrgency] = useState<"critical" | "urgent">(
    "critical",
  );
  const [stepNumber, setStepNumber] = useState(1);
  const [stepRadius, setStepRadius] = useState(2);
  const [stepAfterMinutes, setStepAfterMinutes] = useState(0);

  const [animalSlug, setAnimalSlug] = useState("");
  const [animalLabelEn, setAnimalLabelEn] = useState("");
  const [animalLabelBn, setAnimalLabelBn] = useState("");
  const [animalActive, setAnimalActive] = useState(true);
  const [animalSortOrder, setAnimalSortOrder] = useState(0);

  const TABS: { id: Tab; labelKey: Parameters<typeof translate>[1] }[] = [
    { id: "queue", labelKey: "moderation_nav_queue" },
    { id: "reports", labelKey: "moderation_nav_reports" },
    { id: "restrictions", labelKey: "moderation_nav_restrictions" },
    { id: "appeals", labelKey: "moderation_nav_appeals" },
    { id: "audit", labelKey: "moderation_nav_audit_log" },
    ...(isAdministrator
      ? ([{ id: "settings", labelKey: "moderation_nav_settings" }] as const)
      : []),
  ];

  return (
    <main>
      <h1>{t("moderation_dashboard_heading")}</h1>
      <nav>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {tab === "queue" && (
        <section>
          <h2>{t("moderation_critical_queue_heading")}</h2>
          <label>
            <input
              type="checkbox"
              checked={unansweredOnly}
              onChange={(e) => setUnansweredOnly(e.target.checked)}
            />
            {t("moderation_unanswered_only_toggle")}
          </label>
          {queueCases.length === 0 && <p>{t("moderation_queue_empty")}</p>}
          <table>
            <tbody>
              {queueCases.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/case/${c.id}`}>{c.public_reference}</Link>
                  </td>
                  <td>{c.title}</td>
                  <td>
                    {t(
                      `urgency_${c.urgency}` as Parameters<typeof translate>[1],
                    )}
                  </td>
                  <td>{c.status}</td>
                  <td>{new Date(c.reported_at).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>{t("moderation_merge_heading")}</h3>
          <input
            placeholder={t("moderation_merge_source_label")}
            value={mergeSource}
            onChange={(e) => setMergeSource(e.target.value)}
          />
          <input
            placeholder={t("moderation_merge_target_label")}
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
          />
          <ReasonAction
            label={t("moderation_merge_action")}
            t={t}
            onConfirm={async (reason) => {
              if (!mergeSource.trim() || !mergeTarget.trim()) return;
              await mergeDuplicateCases(supabase, {
                sourceCaseId: mergeSource.trim(),
                targetCaseId: mergeTarget.trim(),
                reason,
              });
              setMergeSource("");
              setMergeTarget("");
              await loadQueue();
            }}
          />

          <h3>{t("moderation_redact_heading")}</h3>
          <input
            placeholder="case id"
            value={redactCaseId}
            onChange={(e) => setRedactCaseId(e.target.value)}
          />
          <ReasonAction
            label={t("moderation_redact_action")}
            t={t}
            onConfirm={async (reason) => {
              if (!redactCaseId.trim()) return;
              await redactCaseSensitiveInfo(supabase, {
                caseId: redactCaseId.trim(),
                reason,
              });
              setRedactCaseId("");
            }}
          />

          <h3>{t("moderation_status_correction_heading")}</h3>
          <input
            placeholder="case id"
            value={correctCaseId}
            onChange={(e) => setCorrectCaseId(e.target.value)}
          />
          <input
            placeholder="new status"
            value={correctStatus}
            onChange={(e) =>
              setCorrectStatus(
                e.target.value as Database["public"]["Enums"]["case_status"],
              )
            }
          />
          <ReasonAction
            label={t("moderation_status_correction_action")}
            t={t}
            onConfirm={async (reason) => {
              if (!correctCaseId.trim()) return;
              await correctCaseStatus(supabase, userId, {
                caseId: correctCaseId.trim(),
                newStatus: correctStatus,
                reason,
              });
              setCorrectCaseId("");
              await loadQueue();
            }}
          />
        </section>
      )}

      {tab === "reports" && (
        <section>
          <h2>{t("moderation_reports_heading")}</h2>
          <table>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    {t(
                      `moderation_report_target_${r.target_type}` as Parameters<
                        typeof translate
                      >[1],
                    )}
                  </td>
                  <td>
                    {t(
                      `report_reason_${r.reason}` as Parameters<
                        typeof translate
                      >[1],
                    )}
                  </td>
                  <td>{r.details}</td>
                  <td>
                    {t(
                      `content_report_status_${r.status}` as Parameters<
                        typeof translate
                      >[1],
                    )}
                  </td>
                  <td style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateContentReportStatus(
                          supabase,
                          r.id,
                          "reviewing",
                        );
                        await loadReports();
                      }}
                    >
                      {t("moderation_mark_reviewing_action")}
                    </button>
                    <ReasonAction
                      label={t("moderation_hide_action")}
                      t={t}
                      onConfirm={async (reason) => {
                        await hideReportedTarget(r, true, reason);
                        await updateContentReportStatus(
                          supabase,
                          r.id,
                          "resolved",
                        );
                        await loadReports();
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await updateContentReportStatus(
                          supabase,
                          r.id,
                          "dismissed",
                        );
                        await loadReports();
                      }}
                    >
                      {t("moderation_dismiss_action")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "restrictions" && (
        <section>
          <h2>{t("moderation_restrictions_heading")}</h2>
          <input
            placeholder="user id"
            value={newRestrictionUserId}
            onChange={(e) => setNewRestrictionUserId(e.target.value)}
          />
          <select
            value={newRestrictionType}
            onChange={(e) =>
              setNewRestrictionType(e.target.value as AccountRestrictionType)
            }
          >
            {(["warning", "restricted", "suspended", "banned"] as const).map(
              (type) => (
                <option key={type} value={type}>
                  {t(
                    `account_restriction_type_${type}` as Parameters<
                      typeof translate
                    >[1],
                  )}
                </option>
              ),
            )}
          </select>
          <ReasonAction
            label={t("moderation_issue_restriction_action")}
            t={t}
            onConfirm={async (reason) => {
              if (!newRestrictionUserId.trim()) return;
              await issueAccountRestriction(supabase, {
                userId: newRestrictionUserId.trim(),
                restrictionType: newRestrictionType,
                reason,
              });
              setNewRestrictionUserId("");
              await loadRestrictions();
            }}
          />

          <table>
            <tbody>
              {restrictions.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_id}</td>
                  <td>
                    {t(
                      `account_restriction_type_${r.restriction_type}` as Parameters<
                        typeof translate
                      >[1],
                    )}
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    {r.lifted_at
                      ? t("moderation_restriction_lifted_label")
                      : t("moderation_restriction_active_label")}
                  </td>
                  <td>
                    {!r.lifted_at && (
                      <ReasonAction
                        label={t("moderation_lift_restriction_action")}
                        t={t}
                        onConfirm={async (reason) => {
                          await liftAccountRestriction(supabase, r.id, reason);
                          await loadRestrictions();
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "appeals" && (
        <section>
          <h2>{t("moderation_appeals_heading")}</h2>
          <table>
            <tbody>
              {appeals.map((a) => (
                <tr key={a.id}>
                  <td>{a.statement}</td>
                  <td>
                    {t(
                      `appeal_status_${a.status}` as Parameters<
                        typeof translate
                      >[1],
                    )}
                  </td>
                  <td>
                    {restrictions.find((r) => r.id === a.restriction_id)
                      ?.issued_by === userId && (
                      <em>{t("moderation_appeal_review_own_notice")}</em>
                    )}
                  </td>
                  <td>
                    {a.status === "pending" && (
                      <span style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          onClick={async () => {
                            await reviewModerationAppeal(supabase, userId, {
                              appealId: a.id,
                              status: "upheld",
                            });
                            await loadAppeals();
                          }}
                        >
                          {t("moderation_appeal_uphold_action")}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await reviewModerationAppeal(supabase, userId, {
                              appealId: a.id,
                              status: "overturned",
                            });
                            await loadAppeals();
                          }}
                        >
                          {t("moderation_appeal_overturn_action")}
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "audit" && (
        <section>
          <h2>{t("moderation_audit_log_heading")}</h2>
          <nav>
            <button type="button" onClick={() => setAuditTab("actions")}>
              {t("moderation_actions_tab")}
            </button>
            <button type="button" onClick={() => setAuditTab("logs")}>
              {t("audit_logs_tab")}
            </button>
          </nav>
          {auditTab === "actions" ? (
            <table>
              <tbody>
                {moderationActions.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString(locale)}</td>
                    <td>{a.moderator_id}</td>
                    <td>{a.action_type}</td>
                    <td>
                      {a.target_type}:{a.target_id}
                    </td>
                    <td>{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <tbody>
                {auditLogs.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString(locale)}</td>
                    <td>{a.actor_id}</td>
                    <td>{a.action}</td>
                    <td>
                      {a.target_type}:{a.target_id}
                    </td>
                    <td>{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "settings" && isAdministrator && (
        <section>
          <h2>{t("moderation_settings_heading")}</h2>
          <h3>{t("moderation_escalation_steps_heading")}</h3>
          <table>
            <tbody>
              {steps.map((s) => (
                <tr key={`${s.urgency}-${s.step}`}>
                  <td>{s.urgency}</td>
                  <td>{s.step}</td>
                  <td>{s.radius_km}</td>
                  <td>{s.after_minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <select
            value={stepUrgency}
            onChange={(e) =>
              setStepUrgency(e.target.value as "critical" | "urgent")
            }
          >
            <option value="critical">critical</option>
            <option value="urgent">urgent</option>
          </select>
          <input
            type="number"
            aria-label={t("escalation_step_number_label")}
            value={stepNumber}
            onChange={(e) => setStepNumber(Number(e.target.value))}
          />
          <input
            type="number"
            aria-label={t("escalation_step_radius_label")}
            value={stepRadius}
            onChange={(e) => setStepRadius(Number(e.target.value))}
          />
          <input
            type="number"
            aria-label={t("escalation_step_after_minutes_label")}
            value={stepAfterMinutes}
            onChange={(e) => setStepAfterMinutes(Number(e.target.value))}
          />
          <button
            type="button"
            onClick={async () => {
              await upsertAlertEscalationStep(supabase, {
                urgency: stepUrgency,
                step: stepNumber,
                radiusKm: stepRadius,
                afterMinutes: stepAfterMinutes,
              });
              const { data } = await listAlertEscalationSteps(supabase);
              setSteps(data ?? []);
            }}
          >
            {t("moderation_escalation_save_action")}
          </button>

          <h3>{t("moderation_animal_types_heading")}</h3>
          <table>
            <tbody>
              {animalTypes.map((a) => (
                <tr key={a.id}>
                  <td>{a.slug}</td>
                  <td>{a.label_en}</td>
                  <td>{a.label_bn}</td>
                  <td>{a.is_active ? "active" : "inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <input
            placeholder={t("animal_type_slug_label")}
            value={animalSlug}
            onChange={(e) => setAnimalSlug(e.target.value)}
          />
          <input
            placeholder={t("animal_type_label_en_label")}
            value={animalLabelEn}
            onChange={(e) => setAnimalLabelEn(e.target.value)}
          />
          <input
            placeholder={t("animal_type_label_bn_label")}
            value={animalLabelBn}
            onChange={(e) => setAnimalLabelBn(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={animalActive}
              onChange={(e) => setAnimalActive(e.target.checked)}
            />
            {t("animal_type_active_toggle_label")}
          </label>
          <input
            type="number"
            aria-label="sort order"
            value={animalSortOrder}
            onChange={(e) => setAnimalSortOrder(Number(e.target.value))}
          />
          <button
            type="button"
            onClick={async () => {
              if (
                !animalSlug.trim() ||
                !animalLabelEn.trim() ||
                !animalLabelBn.trim()
              )
                return;
              await upsertAnimalType(supabase, {
                slug: animalSlug.trim(),
                labelEn: animalLabelEn.trim(),
                labelBn: animalLabelBn.trim(),
                isActive: animalActive,
                sortOrder: animalSortOrder,
              });
              setAnimalSlug("");
              setAnimalLabelEn("");
              setAnimalLabelBn("");
              const { data } = await listAllAnimalTypes(supabase);
              setAnimalTypes(data ?? []);
            }}
          >
            {t("moderation_animal_type_save_action")}
          </button>
        </section>
      )}
    </main>
  );
}
