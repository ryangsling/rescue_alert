import type { PropsWithChildren } from "react";
import { Modal, Pressable } from "react-native";
import { Surface } from "../primitives/Surface";

export interface SheetProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
  className?: string;
}

/**
 * design/DESIGN.md section 8.2 level 2: sticky action region and
 * bottom sheet. Used for e.g. the case closure flow (section 14.5),
 * which DESIGN.md explicitly says must not be a simple destructive
 * confirmation dialog - Sheet gives it room to scroll.
 */
export function Sheet({
  visible,
  onRequestClose,
  className,
  children,
}: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <Pressable
        className="flex-1 justify-end bg-scrim"
        accessibilityLabel="Dismiss sheet"
        accessibilityRole="button"
        onPress={onRequestClose}
      >
        <Pressable onPress={() => {}}>
          <Surface
            elevation="level2"
            radius="none"
            className={["max-h-[85%] gap-4 rounded-t-large p-6", className]
              .filter(Boolean)
              .join(" ")}
            accessibilityViewIsModal
            accessibilityRole="none"
          >
            {children}
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
