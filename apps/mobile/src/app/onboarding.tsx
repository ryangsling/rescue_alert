import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Button,
  Checkbox,
  LoadingState,
  RadioGroup,
  SafeAreaContainer,
  Stack,
  Text,
} from "@rescue-alert/ui";
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
import { supabase } from "../supabase-client";

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

const RADIUS_OPTIONS = ["1", "3", "5", "10", "15", "25"] as const;

export default function OnboardingScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[] | null>(null);
  const [capabilities, setCapabilities] = useState<VolunteerCapability[]>([]);
  const [animalTypeIds, setAnimalTypeIds] = useState<string[]>([]);
  const [alertRadiusKm, setAlertRadiusKm] =
    useState<(typeof RADIUS_OPTIONS)[number]>("5");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnimalTypes() {
      const { data } = await supabase
        .from("animal_types")
        .select("id, slug, label_en, label_bn")
        .eq("is_active", true)
        .order("sort_order");
      setAnimalTypes(data ?? []);
    }
    void loadAnimalTypes();
  }, []);

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
      alertRadiusKm: Number(alertRadiusKm),
    });
    if (!capabilitiesResult.success || !preferencesResult.success) {
      setError(t("form_required_field"));
      return;
    }

    setSubmitting(true);
    const { error: rpcError } = await completeOnboarding(supabase, {
      ...capabilitiesResult.data,
      ...preferencesResult.data,
    });
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.replace("/");
  }

  if (step === 1) {
    return (
      <SafeAreaContainer>
        <Stack gap="4" className="flex-1 p-6">
          <Text variant="heading1">{t("onboarding_capabilities_heading")}</Text>
          <Text tone="muted">{t("onboarding_capabilities_instructions")}</Text>

          {CAPABILITIES.map((capability) => (
            <Checkbox
              key={capability}
              label={t(CAPABILITY_LABEL_KEY[capability])}
              checked={capabilities.includes(capability)}
              onChange={() => toggleCapability(capability)}
            />
          ))}

          <Button variant="primary" onPress={() => setStep(2)}>
            {t("onboarding_continue")}
          </Button>
        </Stack>
      </SafeAreaContainer>
    );
  }

  if (animalTypes === null) {
    return (
      <SafeAreaContainer>
        <LoadingState />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="4" className="flex-1 p-6">
        <Text variant="heading1">{t("onboarding_animal_types_heading")}</Text>

        {animalTypes.map((animalType) => (
          <Checkbox
            key={animalType.id}
            label={locale === "bn" ? animalType.label_bn : animalType.label_en}
            checked={animalTypeIds.includes(animalType.id)}
            onChange={() => toggleAnimalType(animalType.id)}
          />
        ))}

        <RadioGroup
          label={t("onboarding_alert_radius_heading")}
          value={alertRadiusKm}
          onChange={setAlertRadiusKm}
          options={RADIUS_OPTIONS.map((km) => ({
            value: km,
            label: t("onboarding_alert_radius_unit_km", { km }),
          }))}
        />

        {error && <Text className="text-critical">{error}</Text>}

        <Button variant="primary" loading={submitting} onPress={handleFinish}>
          {t("onboarding_finish")}
        </Button>
      </Stack>
    </SafeAreaContainer>
  );
}
