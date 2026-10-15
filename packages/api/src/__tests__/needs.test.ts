import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { listCaseNeeds, addCaseNeed, removeCaseNeed } from "../needs";

describe("listCaseNeeds", () => {
  it("queries case_needs for the given case, oldest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await listCaseNeeds(client, "case-1");
    expect(from).toHaveBeenCalledWith("case_needs");
    expect(eq).toHaveBeenCalledWith("case_id", "case-1");
  });
});

describe("addCaseNeed", () => {
  it("inserts a case_id/need_type row", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const client = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await addCaseNeed(client, "case-1", "transport");
    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      need_type: "transport",
    });
  });
});

describe("removeCaseNeed", () => {
  it("deletes by case_id and need_type together", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const del = vi.fn(() => ({ eq: eq1 }));
    const client = {
      from: vi.fn(() => ({ delete: del })),
    } as unknown as SupabaseClient<Database>;

    await removeCaseNeed(client, "case-1", "transport");
    expect(eq1).toHaveBeenCalledWith("case_id", "case-1");
    expect(eq2).toHaveBeenCalledWith("need_type", "transport");
  });
});
