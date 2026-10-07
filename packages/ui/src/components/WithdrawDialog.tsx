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
}

/** RESP-004: withdrawal always requires a stated reason. */
export function WithdrawDialog({
  visible,
  onRequestClose,
  onConfirm,
  submitting = false,
}: WithdrawDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      visible={visible}
      onRequestClose={onRequestClose}
      title="Withdraw your commitment"
    >
      <TextArea
        label="Why are you withdrawing?"
        value={reason}
        onChangeText={setReason}
        rows={3}
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="text" onPress={onRequestClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={reason.trim().length === 0 || submitting}
          onPress={() => onConfirm(reason.trim())}
        >
          Withdraw
        </Button>
      </View>
    </Dialog>
  );
}
