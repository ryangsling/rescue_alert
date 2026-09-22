import { View, type ViewProps } from "react-native";
import type { SpacingToken } from "@rescue-alert/design-tokens";

export interface StackProps extends ViewProps {
  direction?: "row" | "column";
  /** design/DESIGN.md section 7.1 spacing step between children. */
  gap?: SpacingToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  className?: string;
}

const ALIGN_CLASS = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const JUSTIFY_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

/** Flex row/column layout primitive. design/DESIGN.md section 18.2 primitives. */
export function Stack({
  direction = "column",
  gap,
  align,
  justify,
  className,
  ...props
}: StackProps) {
  const classes = [
    direction === "row" ? "flex-row" : "flex-col",
    gap !== undefined ? `gap-${gap}` : undefined,
    align ? ALIGN_CLASS[align] : undefined,
    justify ? JUSTIFY_CLASS[justify] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <View className={classes} {...props} />;
}
