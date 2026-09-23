"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@rescue-alert/api";
import {
  onboardingCapabilitiesSchema,
  onboardingPreferencesSchema,
} from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { createClient } from "../../lib/supabase/client";

type VolunteerCapability =
  Database["public"]["Enums"]["volunteer_capability_type"];
type AnimalType = {
  id: string;
  slug: string;
  label_en: string;
  label_bn: string;
};

const CAPABILITIES: VolunteerCapability[] = [
  "on_site_rescue",
  "transport",
  "veterinary_professional",
  "veterinary_assistant",
  "temporary_foster",
  "shelter_coordination",
  "adoption_support",
  "case_coordination",
  "financial_support_interest",
];

const CAPABILITY_LABEL_KEY: Record<VolunteerCapability, TranslationKey> = {
  on_site_rescue: "capability_on_site_rescue",
  transport: "capability_transport",
  veterinary_professional: "capability_veterinary_professional",
  veterinary_assistant: "capability_veterinary_assistant",
  temporary_foster: "capability_temporary_foster",
  shelter_coordination: "capability_shelter_coordination",
  adoption_support: "capability_adoption_support",
  case_coordination: "capability_case_coordination",
  financial_support_interest: "capability_financial_support_interest",
};

export function OnboardingWizard({
  animalTypes,
}: {
  animalTypes: AnimalType[];
}) {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [capabilities, setCapabilities] = useState<VolunteerCapability[]>([]);
  const [animalTypeIds, setAnimalTypeIds] = useState<string[]>([]);
  const [alertRadiusKm, setAlertRadiusKm] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCapability(capability: VolunteerCapability) {
    setCapabilities((current) =>
      current.includes(capability)
        ? current.filter((value) => value !== capability)
        : [...current, capability],
    );
  }

  function toggleAnimalType(id: string) {
    setAnimalTypeIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function handleFinish() {
    setError(null);
    const capabilitiesResult = onboardingCapabilitiesSchema.safeParse({
      capabilities,
    });
    const preferencesResult = onboardingPreferencesSchema.safeParse({
      preferredAnimalTypeIds: animalTypeIds,
      alertRadiusKm,
    });
    if (!capabilitiesResult.success || !preferencesResult.success) {
      setError(t("form_required_field"));
      return;
    }

    setSubmitting(true);
    const { error: rpcError } = await completeOnboarding(createClient(), {
      ...capabilitiesResult.data,
      ...preferencesResult.data,
    });
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.push("/");
  }

  if (step === 1) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
        <h1 className="text-2xl font-bold text-text">
          {t("onboarding_capabilities_heading")}
        </h1>
        <p className="text-text-muted">
          {t("onboarding_capabilities_instructions")}
        </p>

        <div className="flex flex-col gap-2">
          {CAPABILITIES.map((capability) => (
            <label key={capability} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={capabilities.includes(capability)}
                onChange={() => toggleCapability(capability)}
              />
              <span className="text-text">
                {t(CAPABILITY_LABEL_KEY[capability])}
              </span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary"
        >
          {t("onboarding_continue")}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold text-text">
        {t("onboarding_animal_types_heading")}
      </h1>

      <div className="flex flex-col gap-2">
        {animalTypes.map((animalType) => (
          <label key={animalType.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={animalTypeIds.includes(animalType.id)}
              onChange={() => toggleAnimalType(animalType.id)}
            />
            <span className="text-text">
              {locale === "bn" ? animalType.label_bn : animalType.label_en}
            </span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-text">
          {t("onboarding_alert_radius_heading")} -{" "}
          {t("onboarding_alert_radius_unit_km", { km: alertRadiusKm })}
        </span>
        <input
          type="range"
          min={1}
          max={25}
          value={alertRadiusKm}
          onChange={(event) => setAlertRadiusKm(Number(event.target.value))}
        />
      </label>

      {error && <p className="text-critical">{error}</p>}

      <button
        type="button"
        disabled={submitting}
        onClick={handleFinish}
        className="min-h-12 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50"
      >
        {t("onboarding_finish")}
      </button>
    </main>
  );
}
