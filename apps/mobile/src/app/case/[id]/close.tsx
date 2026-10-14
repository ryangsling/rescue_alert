import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Banner,
  Button,
  Checkbox,
  LoadingState,
  OutcomeSelector,
  SafeAreaContainer,
  Stack,
  Text,
  TextArea,
  TextField,
} from "@rescue-alert/ui";
import {
  closeCase,
  findCaseIdByPublicReference,
  getProfileNames,
  listCaseResponses,
} from "@rescue-alert/api";
import { closeCaseSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../../../supabase-client";

type ClosureOutcome = Database["public"]["Enums"]["closure_outcome"];
type AssistanceType = Database["public"]["Enums"]["assistance_type"];
type ContributionCategory =
  Database["public"]["Enums"]["contribution_category"];
type ResponseRow = Database["public"]["Tables"]["case_responses"]["Row"];

const OUTCOME_LABEL_KEY: Record<ClosureOutcome, TranslationKey> = {
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

/**
 * Not every assistance type has a matching contribution category
 * (PRD 13.1 vs PRD 8's assistance types are different lists) -
 * financial_support deliberately has no category at all, per PRD
 * 13.3's "do not reward unverified monetary claims", and
 * shelter_coordination has no close match either. A responder
 * committed only to those is still listed, just without a
 * creditable category.
 */
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

export default function CloseCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);

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
      if (!id) return;
      const { data } = await listCaseResponses(supabase, id);
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
  }, [id]);

  function toggleCredited(responderId: string) {
    setCreditedResponderIds((current) => {
      const next = new Set(current);
      if (next.has(responderId)) next.delete(responderId);
      else next.add(responderId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!id) return;
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
      caseId: id,
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
    router.replace(`/case/${id}`);
  }

  if (loading) {
    return (
      <SafeAreaContainer>
        <LoadingState />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="6" className="flex-1 p-6">
        <Text variant="heading1">{t("case_close_heading")}</Text>

        <OutcomeSelector
          label={t("case_close_outcome_label")}
          options={OUTCOME_ORDER.map((value) => ({
            value,
            label: t(OUTCOME_LABEL_KEY[value]),
          }))}
          value={outcome}
          onChange={setOutcome}
        />

        <TextArea
          label={t("case_close_final_update_label")}
          value={finalUpdate}
          onChangeText={setFinalUpdate}
          rows={4}
        />

        {responders.length > 0 ? (
          <Stack gap="3">
            <Text variant="titleMedium">
              {t("case_close_contributions_heading")}
            </Text>
            <Text tone="muted">
              {t("case_close_contributions_instructions")}
            </Text>
            {responders.map((r) => (
              <Checkbox
                key={r.id}
                label={profileNames[r.responder_id] ?? r.responder_id}
                checked={creditedResponderIds.has(r.responder_id)}
                onChange={() => toggleCredited(r.responder_id)}
                disabled={primaryContributionCategory(r) === null}
              />
            ))}
          </Stack>
        ) : null}

        <Stack gap="3">
          <Text variant="titleMedium">{t("case_close_follow_up_heading")}</Text>
          <Text tone="muted">{t("case_close_follow_up_instructions")}</Text>
          <TextField
            label={t("case_close_follow_up_reference_label")}
            value={followUpReference}
            onChangeText={setFollowUpReference}
            autoCapitalize="characters"
          />
        </Stack>

        <Stack gap="2" className="rounded-medium border border-border p-4">
          <Text variant="titleMedium">{t("case_close_review_heading")}</Text>
          <Text tone="muted">{t("case_close_review_body")}</Text>
        </Stack>

        {error ? <Banner tone="critical" message={error} /> : null}

        <Button
          loading={submitting}
          disabled={!outcome || !finalUpdate.trim()}
          onPress={handleSubmit}
        >
          {t("case_close_submit")}
        </Button>
      </Stack>
    </SafeAreaContainer>
  );
}
