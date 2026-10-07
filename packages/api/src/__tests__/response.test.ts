import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  createResponse,
  withdrawResponse,
  updateResponseStatus,
  listCaseResponses,
} from "../response";

function mockClient() {
  const single = vi.fn().mockResolvedValue({ data: { id: "r1" }, error: null });
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert, update, select, eq }));
  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, from, insert, update, eq, select, single };
}

describe("createResponse", () => {
  it("inserts with the caller as responder_id, never trusting input for that field", async () => {
    const { client, from, insert } = mockClient();
    await createResponse(client, "responder-1", {
      caseId: "case-1",
      assistanceTypes: ["on_site_rescue"],
    });

    expect(from).toHaveBeenCalledWith("case_responses");
    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      responder_id: "responder-1",
      assistance_types: ["on_site_rescue"],
      eta_at: undefined,
      availability_note: undefined,
    });
  });
});

describe("withdrawResponse", () => {
  it("sets status withdrawn with the given reason, filtered by response id", async () => {
    const { client, update, eq } = mockClient();
    await withdrawResponse(client, {
      responseId: "r1",
      reason: "no longer available",
    });

    expect(update).toHaveBeenCalledWith({
      status: "withdrawn",
      withdrawal_reason: "no longer available",
    });
    expect(eq).toHaveBeenCalledWith("id", "r1");
  });
});

describe("updateResponseStatus", () => {
  it("updates only the status column", async () => {
    const { client, update } = mockClient();
    await updateResponseStatus(client, {
      responseId: "r1",
      status: "confirmed",
    });
    expect(update).toHaveBeenCalledWith({ status: "confirmed" });
  });
});

describe("listCaseResponses", () => {
  it("filters by case id, oldest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    await listCaseResponses(client, "case-1");
    expect(eq).toHaveBeenCalledWith("case_id", "case-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});
