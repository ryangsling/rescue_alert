"use client";

import type { ReactNode } from "react";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";

// Referencing `window` happens only inside these function bodies, run
// from LocaleProvider's client-only effects - never at module-eval
// time, which is what would break Next.js's server-side render pass
// of this "use client" component.
const webLocaleStorage: LocaleStorage = {
  getItem: (key) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  setItem: (key, value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
};

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  return <LocaleProvider storage={webLocaleStorage}>{children}</LocaleProvider>;
}
