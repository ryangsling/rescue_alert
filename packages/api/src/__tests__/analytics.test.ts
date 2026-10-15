import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  getOperationalDashboardSignals,
  recordAnalyticsEvent,
} from "../analytics";

describe("recordAnalyticsEvent", () => {
  it("calls record_analytics_event with the p_-prefixed argument names it expects", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await recordAnalyticsEvent(client, "report_submitted", {
      incidentType: "injured_animal",
    });

    expect(rpc).toHaveBeenCalledWith("record_analytics_event", {
      p_event_name: "report_submitted",
      p_properties: { incidentType: "injured_animal" },
    });
  });

  it("defaults properties to an empty object", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await recordAnalyticsEvent(client, "case_closed");

    expect(rpc).toHaveBeenCalledWith("record_analytics_event", {
      p_event_name: "case_closed",
      p_properties: {},
    });
  });
});

describe("getOperationalDashboardSignals", () => {
  it("calls get_operational_dashboard_signals with no arguments", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await getOperationalDashboardSignals(client);

    expect(rpc).toHaveBeenCalledWith("get_operational_dashboard_signals");
  });
});
