import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { completeOnboarding } from "../onboarding";

describe("completeOnboarding", () => {
  it("calls the complete_onboarding RPC with the p_-prefixed argument names it expects", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await completeOnboarding(client, {
      capabilities: ["on_site_rescue"],
      preferredAnimalTypeIds: ["11111111-1111-1111-1111-111111111111"],
      alertRadiusKm: 5,
    });

    expect(rpc).toHaveBeenCalledWith("complete_onboarding", {
      p_capabilities: ["on_site_rescue"],
      p_preferred_animal_type_ids: ["11111111-1111-1111-1111-111111111111"],
      p_alert_radius_km: 5,
    });
  });
});
