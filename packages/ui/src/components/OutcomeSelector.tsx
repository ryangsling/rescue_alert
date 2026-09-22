import { RadioGroup } from "./RadioGroup";
import type { Database } from "@rescue-alert/types";

type ClosureOutcome = Database["public"]["Enums"]["closure_outcome"];

/** PRD section 9.3, in the order listed there. */
const OUTCOME_LABELS: Record<ClosureOutcome, string> = {
  successfully_rescued: "Successfully rescued",
  treated_and_returned_safely: "Treated and returned safely",
  transferred_to_veterinary_care: "Transferred to veterinary care",
  transferred_to_organization: "Transferred to an animal-welfare organization",
  moved_to_temporary_foster: "Moved to temporary foster care",
  moved_to_shelter: "Moved to shelter",
  adopted: "Adopted",
  recovered_without_intervention: "Animal recovered without intervention",
  could_not_be_found: "Animal could not be found",
  duplicate_report: "Duplicate report",
  report_inaccurate: "Report determined inaccurate",
  died_before_help_arrived: "Animal died before help arrived",
  died_during_or_after_treatment: "Animal died during or after treatment",
  other_documented_outcome: "Other documented outcome",
};

const OUTCOME_OPTIONS = Object.entries(OUTCOME_LABELS).map(
  ([value, label]) => ({
    value: value as ClosureOutcome,
    label,
  }),
) satisfies { value: ClosureOutcome; label: string }[];

export interface OutcomeSelectorProps {
  value: ClosureOutcome | null;
  onChange: (value: ClosureOutcome) => void;
  errorText?: string;
  className?: string;
}

/** design/DESIGN.md section 18.2 primitives list, section 14.5 closure sheet step 1. OUT-001: a structured closure outcome is required. */
export function OutcomeSelector({
  value,
  onChange,
  errorText,
  className,
}: OutcomeSelectorProps) {
  return (
    <RadioGroup
      label="Outcome"
      options={OUTCOME_OPTIONS}
      value={value}
      onChange={onChange}
      errorText={errorText}
      className={className}
    />
  );
}
