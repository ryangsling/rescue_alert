import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    redirect("/sign-in");
  }

  const { data: animalTypes } = await supabase
    .from("animal_types")
    .select("id, slug, label_en, label_bn")
    .eq("is_active", true)
    .order("sort_order");

  return <OnboardingWizard animalTypes={animalTypes ?? []} />;
}
