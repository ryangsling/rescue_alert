import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import { getProfileNames } from "../profile";

describe("getProfileNames", () => {
  it("de-duplicates ids and returns an id-to-name map", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [
        { id: "u1", full_name: "Rahim" },
        { id: "u2", full_name: "Nusrat" },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ in: inFn }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    const result = await getProfileNames(client, ["u1", "u2", "u1"]);
    expect(inFn).toHaveBeenCalledWith("id", ["u1", "u2"]);
    expect(result).toEqual({ u1: "Rahim", u2: "Nusrat" });
  });

  it("returns an empty map without querying when given no ids", async () => {
    const from = vi.fn();
    const client = { from } as unknown as SupabaseClient<Database>;

    const result = await getProfileNames(client, []);
    expect(result).toEqual({});
    expect(from).not.toHaveBeenCalled();
  });
});
