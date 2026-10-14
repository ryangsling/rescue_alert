import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  getPublicCaseDetail,
  listPublicOpenCases,
  listPublicRescueHistory,
  getPublicMediaSignedUrl,
} from "../public";

describe("getPublicCaseDetail", () => {
  it("wraps get_public_case_detail with the public reference", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    await getPublicCaseDetail(client, "RA-ABC12345");
    expect(rpc).toHaveBeenCalledWith("get_public_case_detail", {
      p_public_reference: "RA-ABC12345",
    });
  });
});

describe("listPublicOpenCases / listPublicRescueHistory", () => {
  it("default to a page of 20 starting at 0", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await listPublicOpenCases(client);
    expect(rpc).toHaveBeenCalledWith("list_public_open_cases", {
      p_limit: 20,
      p_offset: 0,
    });

    await listPublicRescueHistory(client, 5, 10);
    expect(rpc).toHaveBeenCalledWith("list_public_rescue_history", {
      p_limit: 5,
      p_offset: 10,
    });
  });
});

describe("getPublicMediaSignedUrl", () => {
  it("requests a signed URL from the rescue-media bucket", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: "https://x" }, error: null });
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as unknown as SupabaseClient<Database>;

    await getPublicMediaSignedUrl(client, "case-1/photo.jpg");

    expect(client.storage.from).toHaveBeenCalledWith("rescue-media");
    expect(createSignedUrl).toHaveBeenCalledWith("case-1/photo.jpg", 3600);
  });
});
