import { RadioGroup } from "./RadioGroup";
import type { Database } from "@rescue-alert/types";

type ClosureOutcome = Database["public"]["Enums"]["closure_outcome"];

export interface OutcomeSelectorProps {
  /** Translated by the caller - this component owns no English text of its own. */
  label: string;
  /** Translated by the caller, in PRD section 9.3's order. */
  options: readonly { value: ClosureOutcome; label: string }[];
  value: ClosureOutcome | null;
  onChange: (value: ClosureOutcome) => void;
  errorText?: string;
  className?: string;
}

/** design/DESIGN.md section 18.2 primitives list, section 14.5 closure sheet step 1. OUT-001: a structured closure outcome is required. */
export function OutcomeSelector({
  label,
  options,
  value,
  onChange,
  errorText,
  className,
}: OutcomeSelectorProps) {
  return (
    <RadioGroup
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      errorText={errorText}
      className={className}
    />
  );
}
