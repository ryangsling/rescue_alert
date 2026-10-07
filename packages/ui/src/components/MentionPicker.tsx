import { Menu, type MenuItem } from "./Menu";

export interface MentionCandidate {
  id: string;
  name: string;
}

export interface MentionPickerProps {
  visible: boolean;
  onRequestClose: () => void;
  candidates: readonly MentionCandidate[];
  onPick: (candidate: MentionCandidate) => void;
}

/**
 * Case participants a composer can @mention - creator, coordinator,
 * committed responders, watchers (the same audience notify_* triggers
 * already use server-side, resolved by the caller). Picking one
 * inserts a @[Name](id) token - see packages/validation's
 * buildMentionToken, which this intentionally does not call itself
 * (business logic stays with the caller, per this package's own rule).
 */
export function MentionPicker({
  visible,
  onRequestClose,
  candidates,
  onPick,
}: MentionPickerProps) {
  const items: MenuItem[] = candidates.map((candidate) => ({
    label: candidate.name,
    onSelect: () => onPick(candidate),
  }));

  return (
    <Menu visible={visible} onRequestClose={onRequestClose} items={items} />
  );
}
