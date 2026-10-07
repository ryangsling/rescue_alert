import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { watchCase, unwatchCase, isWatchingCase } from "../watcher";

describe("watchCase", () => {
  it("upserts user_id/case_id", async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    const select = vi.fn(() => ({ single }));
    const upsert = vi.fn(() => ({ select }));
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as SupabaseClient<Database>;

    await watchCase(client, "user-1", "case-1");
    expect(upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      case_id: "case-1",
    });
  });
});

describe("unwatchCase", () => {
  it("deletes by user_id and case_id together", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const del = vi.fn(() => ({ eq: eq1 }));
    const client = {
      from: vi.fn(() => ({ delete: del })),
    } as unknown as SupabaseClient<Database>;

    await unwatchCase(client, "user-1", "case-1");
    expect(eq1).toHaveBeenCalledWith("user_id", "user-1");
    expect(eq2).toHaveBeenCalledWith("case_id", "case-1");
  });
});

describe("isWatchingCase", () => {
  it("reports true when a row is found", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { case_id: "case-1" }, error: null });
    const eq2 = vi.fn(() => ({ maybeSingle }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    const result = await isWatchingCase(client, "user-1", "case-1");
    expect(result.isWatching).toBe(true);
  });

  it("reports false when no row is found", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq2 = vi.fn(() => ({ maybeSingle }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    const result = await isWatchingCase(client, "user-1", "case-1");
    expect(result.isWatching).toBe(false);
  });
});
