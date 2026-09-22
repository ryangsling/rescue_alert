import { View, type ViewProps } from "react-native";

export interface DividerProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/** A single hairline divider using color.border. design/DESIGN.md section 18.2. */
export function Divider({
  orientation = "horizontal",
  className,
  ...props
}: DividerProps) {
  const classes = [
    "bg-border",
    orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <View accessible={false} className={classes} {...props} />;
}
