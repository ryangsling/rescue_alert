"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  closeCase,
  findCaseIdByPublicReference,
  getProfileNames,
  listCaseResponses,
} from "@rescue-alert/api";
import { closeCaseSchema } from "@rescue-alert/validation";
import { translate, useLocale } from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../lib/supabase/client";

type ClosureOutcome = Database["public"]["Enums"]["closure_outcome"];
type AssistanceType = Database["public"]["Enums"]["assistance_type"];
type ContributionCategory =
  Database["public"]["Enums"]["contribution_category"];
type ResponseRow = Database["public"]["Tables"]["case_responses"]["Row"];

const OUTCOME_LABEL_KEY: Record<
  ClosureOutcome,
  Parameters<typeof translate>[1]
> = {
  successfully_rescued: "outcome_successfully_rescued",
  treated_and_returned_safely: "outcome_treated_and_returned_safely",
  transferred_to_veterinary_care: "outcome_transferred_to_veterinary_care",
  transferred_to_organization: "outcome_transferred_to_organization",
  moved_to_temporary_foster: "outcome_moved_to_temporary_foster",
  moved_to_shelter: "outcome_moved_to_shelter",
  adopted: "outcome_adopted",
  recovered_without_intervention: "outcome_recovered_without_intervention",
  could_not_be_found: "outcome_could_not_be_found",
  duplicate_report: "outcome_duplicate_report",
  report_inaccurate: "outcome_report_inaccurate",
  died_before_help_arrived: "outcome_died_before_help_arrived",
  died_during_or_after_treatment: "outcome_died_during_or_after_treatment",
  other_documented_outcome: "outcome_other_documented_outcome",
};

const OUTCOME_ORDER = Object.keys(OUTCOME_LABEL_KEY) as ClosureOutcome[];

/** See the mobile close screen's identical comment for why this map is partial. */
const ASSISTANCE_TO_CONTRIBUTION: Partial<
  Record<AssistanceType, ContributionCategory>
> = {
  on_site_rescue: "on_site_responder",
  transport: "transport_volunteer",
  veterinary_treatment: "veterinary_support",
  temporary_foster: "foster_provider",
  case_coordination: "case_coordinator",
};

function primaryContributionCategory(
  response: ResponseRow,
): ContributionCategory | null {
  for (const type of response.assistance_types) {
    const category = ASSISTANCE_TO_CONTRIBUTION[type];
    if (category) return category;
  }
  return null;
}

const CREDITABLE_STATUSES = new Set<ResponseRow["status"]>([
  "confirmed",
  "completed",
]);

export function CloseCaseForm({ caseId }: { caseId: string }) {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [responders, setResponders] = useState<ResponseRow[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  const [outcome, setOutcome] = useState<ClosureOutcome | null>(null);
  const [finalUpdate, setFinalUpdate] = useState("");
  const [creditedResponderIds, setCreditedResponderIds] = useState<Set<string>>(
    new Set(),
  );
  const [followUpReference, setFollowUpReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await listCaseResponses(supabase, caseId);
      const creditable = (data ?? []).filter((r) =>
        CREDITABLE_STATUSES.has(r.status),
      );
      setResponders(creditable);
      setProfileNames(
        await getProfileNames(
          supabase,
          creditable.map((r) => r.responder_id),
        ),
      );
      setLoading(false);
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  function toggleCredited(responderId: string) {
    setCreditedResponderIds((current) => {
      const next = new Set(current);
      if (next.has(responderId)) next.delete(responderId);
      else next.add(responderId);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);

    let followUpCaseId: string | undefined;
    if (followUpReference.trim()) {
      const { data } = await findCaseIdByPublicReference(
        supabase,
        followUpReference,
      );
      if (!data) {
        setError(t("case_close_follow_up_not_found"));
        return;
      }
      followUpCaseId = data.id;
    }

    const contributions = responders
      .filter((r) => creditedResponderIds.has(r.responder_id))
      .map((r) => {
        const category = primaryContributionCategory(r);
        return category ? { userId: r.responder_id, category } : null;
      })
      .filter(
        (c): c is { userId: string; category: ContributionCategory } =>
          c !== null,
      );

    const result = closeCaseSchema.safeParse({
      caseId,
      outcome,
      finalUpdate,
      followUpCaseId,
      contributions: contributions.length > 0 ? contributions : undefined,
    });
    if (!result.success) {
      setError(
        outcome === null
          ? t("case_close_outcome_required")
          : t("case_close_final_update_required"),
      );
      return;
    }

    setSubmitting(true);
    const { error: closeError } = await closeCase(supabase, result.data);
    setSubmitting(false);
    if (closeError) {
      setError(closeError.message);
      return;
    }
    router.push(`/case/${caseId}`);
  }

  if (loading) {
    return <p className="p-8 text-text-muted">...</p>;
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("case_close_heading")}
      </h1>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">
          {t("case_close_outcome_label")}
        </h2>
        {OUTCOME_ORDER.map((value) => (
          <label key={value} className="flex items-center gap-2">
            <input
              type="radio"
              name="outcome"
              checked={outcome === value}
              onChange={() => setOutcome(value)}
            />
            <span className="text-text">{t(OUTCOME_LABEL_KEY[value])}</span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-text">{t("case_close_final_update_label")}</span>
        <textarea
          value={finalUpdate}
          onChange={(event) => setFinalUpdate(event.target.value)}
          rows={4}
          className="rounded-md border border-border bg-surface p-3 text-text"
        />
      </label>

      {responders.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">
            {t("case_close_contributions_heading")}
          </h2>
          <p className="text-text-muted">
            {t("case_close_contributions_instructions")}
          </p>
          {responders.map((r) => (
            <label key={r.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={creditedResponderIds.has(r.responder_id)}
                disabled={primaryContributionCategory(r) === null}
                onChange={() => toggleCredited(r.responder_id)}
              />
              <span className="text-text">
                {profileNames[r.responder_id] ?? r.responder_id}
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-text">
          {t("case_close_follow_up_heading")}
        </h2>
        <p className="text-text-muted">
          {t("case_close_follow_up_instructions")}
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-text">
            {t("case_close_follow_up_reference_label")}
          </span>
          <input
            value={followUpReference}
            onChange={(event) => setFollowUpReference(event.target.value)}
            className="min-h-12 rounded-md border border-border bg-surface px-4 text-text"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-border p-4">
        <h2 className="font-semibold text-text">
          {t("case_close_review_heading")}
        </h2>
        <p className="text-text-muted">{t("case_close_review_body")}</p>
      </div>

      {error ? (
        <p role="alert" className="text-critical">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting || !outcome || !finalUpdate.trim()}
        onClick={handleSubmit}
        className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
      >
        {t("case_close_submit")}
      </button>
    </main>
  );
}
