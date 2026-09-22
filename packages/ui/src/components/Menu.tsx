import { Modal, Pressable } from "react-native";
import { Text } from "../primitives/Text";
import { Divider } from "../primitives/Divider";
import { Surface } from "../primitives/Surface";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  visible: boolean;
  onRequestClose: () => void;
  items: readonly MenuItem[];
}

/**
 * design/DESIGN.md section 11.1. A simple action list, presented as a
 * centered overlay rather than an anchored dropdown - true anchor
 * positioning needs layout measurement this package does not yet
 * depend on. Reasonable for the MVP's short menus (e.g. "Report",
 * "Hide", "Merge duplicate" in the moderation queue); revisit with
 * anchored positioning if a menu needs to stay near the control that
 * opened it.
 */
export function Menu({ visible, onRequestClose, items }: MenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-scrim p-6"
        accessibilityLabel="Dismiss menu"
        accessibilityRole="button"
        onPress={onRequestClose}
      >
        <Pressable onPress={() => {}}>
          <Surface
            elevation="level3"
            radius="medium"
            className="w-full max-w-xs overflow-hidden"
          >
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                disabled={item.disabled}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
                accessibilityState={{ disabled: item.disabled }}
                className={[
                  "min-h-11 justify-center px-4",
                  item.disabled ? "opacity-50" : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPress={() => {
                  item.onSelect();
                  onRequestClose();
                }}
              >
                {index > 0 ? <Divider className="absolute top-0" /> : null}
                <Text
                  className={item.destructive ? "text-critical" : undefined}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
