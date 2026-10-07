import { useState } from "react";
import { View } from "react-native";
import { Dialog } from "./Dialog";
import { RadioGroup, type RadioOption } from "./RadioGroup";
import { TextArea } from "./TextArea";
import { Button } from "./Button";

export interface ReportDialogProps<TReason extends string> {
  visible: boolean;
  onRequestClose: () => void;
  reasonOptions: readonly RadioOption<TReason>[];
  onConfirm: (reason: TReason, details: string) => void;
  submitting?: boolean;
}

/** MOD-001: reporting a comment, reply, or piece of media. */
export function ReportDialog<TReason extends string>({
  visible,
  onRequestClose,
  reasonOptions,
  onConfirm,
  submitting = false,
}: ReportDialogProps<TReason>) {
  const [reason, setReason] = useState<TReason | null>(null);
  const [details, setDetails] = useState("");

  return (
    <Dialog visible={visible} onRequestClose={onRequestClose} title="Report">
      <RadioGroup
        label="Why are you reporting this?"
        options={reasonOptions}
        value={reason}
        onChange={setReason}
      />
      <TextArea
        label="Anything else moderators should know? (optional)"
        value={details}
        onChangeText={setDetails}
        rows={2}
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="text" onPress={onRequestClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={reason === null || submitting}
          onPress={() => reason && onConfirm(reason, details.trim())}
        >
          Submit report
        </Button>
      </View>
    </Dialog>
  );
}
