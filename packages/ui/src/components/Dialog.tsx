import type { PropsWithChildren } from "react";
import { Modal, Pressable } from "react-native";
import { Text } from "../primitives/Text";
import { Surface } from "../primitives/Surface";

export interface DialogProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  /** design/DESIGN.md section 8.2 level 3: dialog or temporary overlay. */
  className?: string;
}

/**
 * design/DESIGN.md section 11.1/8.2. Uses RN's built-in Modal, which
 * already traps focus and back-button/escape dismissal on the
 * platforms that support it (Android back button and web Escape both
 * call onRequestClose automatically).
 */
export function Dialog({
  visible,
  onRequestClose,
  title,
  className,
  children,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-scrim p-6"
        accessibilityLabel="Dismiss dialog"
        accessibilityRole="button"
        onPress={onRequestClose}
      >
        {/*
          Claims the touch responder so a press on the dialog body
          never reaches the outer scrim Pressable's onPress - React
          Native's touch responder system does this without needing
          e.stopPropagation() (which is not DOM-style bubbling, and is
          not reliably defined on RN's synthetic press event - proven
          directly: calling it crashed a test that pressed inner
          content).
        */}
        <Pressable onPress={() => {}}>
          <Surface
            elevation="level3"
            className={["w-full max-w-sm gap-4 p-6", className]
              .filter(Boolean)
              .join(" ")}
            accessibilityViewIsModal
            accessibilityRole="none"
          >
            <Text variant="heading3">{title}</Text>
            {children}
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
