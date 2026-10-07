import { useState } from "react";
import { View } from "react-native";
import { Dialog } from "./Dialog";
import { TextArea } from "./TextArea";
import { Button } from "./Button";

export interface WithdrawDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
  /** Every visible string below is translated by the caller - this component holds no English text of its own. */
  title: string;
  reasonLabel: string;
  cancelLabel: string;
  confirmLabel: string;
}

/** RESP-004: withdrawal always requires a stated reason. */
export function WithdrawDialog({
  visible,
  onRequestClose,
  onConfirm,
  submitting = false,
  title,
  reasonLabel,
  cancelLabel,
  confirmLabel,
}: WithdrawDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog visible={visible} onRequestClose={onRequestClose} title={title}>
      <TextArea
        label={reasonLabel}
        value={reason}
        onChangeText={setReason}
        rows={3}
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="text" onPress={onRequestClose}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          disabled={reason.trim().length === 0 || submitting}
          onPress={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </View>
    </Dialog>
  );
}
