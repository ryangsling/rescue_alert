import "../global.css";

import { Stack } from "expo-router";
import { ThemeProvider } from "@rescue-alert/ui";
import { LocaleProvider } from "@rescue-alert/localization";
import { mobileLocaleStorage } from "../locale-storage";

export default function RootLayout() {
  return (
    <LocaleProvider storage={mobileLocaleStorage}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </LocaleProvider>
  );
}
