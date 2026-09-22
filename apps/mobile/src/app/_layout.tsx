import "../global.css";

import { Stack } from "expo-router";
import { ThemeProvider } from "@rescue-alert/ui";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
