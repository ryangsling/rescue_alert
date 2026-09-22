"use client";

import { translate, useLocale } from "@rescue-alert/localization";

export default function Home() {
  const { locale, setLocale } = useLocale();

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {translate(locale, "app_name")}
      </h1>
      <p className="text-text-muted">
        Rescue UI foundation - web app scaffold.
      </p>
      <button
        type="button"
        onClick={() => setLocale(locale === "en" ? "bn" : "en")}
        className="rounded-full border border-border px-4 py-2 text-text"
      >
        {locale === "en" ? "বাংলা" : "English"}
      </button>
    </main>
  );
}
