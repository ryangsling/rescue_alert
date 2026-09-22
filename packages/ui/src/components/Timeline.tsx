import { View } from "react-native";
import { OfficialUpdate, type OfficialUpdateProps } from "./OfficialUpdate";

export interface TimelineProps {
  /** Chronological order is the caller's responsibility - this renders whatever order it is given. */
  updates: readonly OfficialUpdateProps[];
  className?: string;
}

/**
 * design/DESIGN.md section 20 item 14 "Official update and timeline" -
 * the ordered list of official updates for a case, per PRD section
 * 7.4 ("the status timeline records meaningful transitions"). Each
 * entry is an OfficialUpdate; this component only orders and spaces
 * them.
 */
export function Timeline({ updates, className }: TimelineProps) {
  return (
    <View className={["gap-3", className].filter(Boolean).join(" ")}>
      {updates.map((update, index) => (
        // Index as key: updates have no stable id in this
        // presentational prop shape, and this is a chronologically
        // fixed list (no reordering/filtering), so index is safe here.
        <OfficialUpdate key={index} {...update} />
      ))}
    </View>
  );
}
