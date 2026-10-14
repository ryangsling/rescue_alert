"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "./translate";

export const LOCALE_STORAGE_KEY = "rescue-alert-locale";
const DEFAULT_LOCALE: Locale = "en";

/**
 * Deliberately not AsyncStorage or localStorage: this package is
 * shared between apps/mobile (Expo) and apps/web (Next.js), so each
 * app supplies its own adapter instead of this package depending on
 * either platform's storage API.
 */
export interface LocaleStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "bn";
}

export interface LocaleProviderProps {
  children: ReactNode;
  storage: LocaleStorage;
  defaultLocale?: Locale;
}

export function LocaleProvider({
  children,
  storage,
  defaultLocale = DEFAULT_LOCALE,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(storage.getItem(LOCALE_STORAGE_KEY)).then((stored) => {
      if (!cancelled && isLocale(stored)) {
        setLocaleState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      void storage.setItem(LOCALE_STORAGE_KEY, next);
    },
    [storage],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
