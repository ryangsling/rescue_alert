import { useState } from "react";
import { View } from "react-native";
import { Dialog } from "./Dialog";
import { TextArea } from "./TextArea";
import { Button } from "./Button";

export interface EditTextDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: (body: string) => void;
  initialValue: string;
  submitting?: boolean;
  /** Every visible string below is translated by the caller - this component holds no English text of its own. */
  title: string;
  bodyLabel: string;
  cancelLabel: string;
  confirmLabel: string;
}

/** Shared editor for a comment or reply body - COMM: editing is distinct from deletion, which stays a soft hide elsewhere. */
export function EditTextDialog({
  visible,
  onRequestClose,
  onConfirm,
  initialValue,
  submitting = false,
  title,
  bodyLabel,
  cancelLabel,
  confirmLabel,
}: EditTextDialogProps) {
  const [body, setBody] = useState(initialValue);

  return (
    <Dialog visible={visible} onRequestClose={onRequestClose} title={title}>
      <TextArea
        label={bodyLabel}
        value={body}
        onChangeText={setBody}
        rows={3}
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="text" onPress={onRequestClose}>
          {cancelLabel}
        </Button>
        <Button
          disabled={body.trim().length === 0 || submitting}
          onPress={() => onConfirm(body.trim())}
        >
          {confirmLabel}
        </Button>
      </View>
    </Dialog>
  );
}
