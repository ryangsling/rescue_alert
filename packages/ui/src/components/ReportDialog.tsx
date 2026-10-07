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
  /** Every visible string below is translated by the caller - this component holds no English text of its own. */
  title: string;
  reasonGroupLabel: string;
  detailsLabel: string;
  cancelLabel: string;
  confirmLabel: string;
}

/** MOD-001: reporting a comment, reply, or piece of media. */
export function ReportDialog<TReason extends string>({
  visible,
  onRequestClose,
  reasonOptions,
  onConfirm,
  submitting = false,
  title,
  reasonGroupLabel,
  detailsLabel,
  cancelLabel,
  confirmLabel,
}: ReportDialogProps<TReason>) {
  const [reason, setReason] = useState<TReason | null>(null);
  const [details, setDetails] = useState("");

  return (
    <Dialog visible={visible} onRequestClose={onRequestClose} title={title}>
      <RadioGroup
        label={reasonGroupLabel}
        options={reasonOptions}
        value={reason}
        onChange={setReason}
      />
      <TextArea label={detailsLabel} value={details} onChangeText={setDetails} rows={2} />
      <View className="flex-row justify-end gap-2">
        <Button variant="text" onPress={onRequestClose}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          disabled={reason === null || submitting}
          onPress={() => reason && onConfirm(reason, details.trim())}
        >
          {confirmLabel}
        </Button>
      </View>
    </Dialog>
  );
}
