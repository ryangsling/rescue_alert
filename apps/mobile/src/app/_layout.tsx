import "../global.css";

import { Stack } from "expo-router";
import { ThemeProvider } from "@rescue-alert/ui";
import { LocaleProvider } from "@rescue-alert/localization";
import { mobileLocaleStorage } from "../locale-storage";
import {
  useNotificationNavigation,
  usePushRegistration,
} from "../push-notifications";

export default function RootLayout() {
  usePushRegistration();
  useNotificationNavigation();

  return (
    <LocaleProvider storage={mobileLocaleStorage}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </LocaleProvider>
  );
}
