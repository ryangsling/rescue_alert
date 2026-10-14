import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  createOrganization,
  setOrganizationAvailability,
  getOrganizationAvailability,
  listOrganizationServices,
  createPlacementRequest,
  respondToPlacementRequest,
  listVerifiedDirectory,
  getFosterAddress,
} from "../organization";

describe("createOrganization", () => {
  it("inserts the organization with created_by stamped, then adds the creator as its first administrator", async () => {
    const orgSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "org-1" }, error: null });
    const orgSelect = vi.fn(() => ({ single: orgSingle }));
    const orgInsert = vi.fn(() => ({ select: orgSelect }));
    const memberInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) =>
      table === "organizations"
        ? { insert: orgInsert }
        : { insert: memberInsert },
    );
    const client = { from } as unknown as SupabaseClient<Database>;

    const result = await createOrganization(client, "user-1", {
      name: "Test NGO",
      orgType: "ngo",
    });

    expect(orgInsert).toHaveBeenCalledWith({
      name: "Test NGO",
      org_type: "ngo",
      created_by: "user-1",
    });
    expect(memberInsert).toHaveBeenCalledWith({
      organization_id: "org-1",
      user_id: "user-1",
      role: "administrator",
    });
    expect(result).toEqual({ data: { id: "org-1" }, error: null });
  });

  it("stops before adding a member if the organization insert fails", async () => {
    const orgSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "nope" } });
    const orgSelect = vi.fn(() => ({ single: orgSingle }));
    const orgInsert = vi.fn(() => ({ select: orgSelect }));
    const memberInsert = vi.fn();
    const from = vi.fn((table: string) =>
      table === "organizations"
        ? { insert: orgInsert }
        : { insert: memberInsert },
    );
    const client = { from } as unknown as SupabaseClient<Database>;

    await createOrganization(client, "user-1", {
      name: "Test NGO",
      orgType: "ngo",
    });

    expect(memberInsert).not.toHaveBeenCalled();
  });
});

describe("setOrganizationAvailability", () => {
  it("upserts with the opted-in arrays exactly as given, never defaulting to everything", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as SupabaseClient<Database>;

    await setOrganizationAvailability(client, "org-1", {
      isCurrentlyAvailable: true,
      optedInUrgencyLevels: ["critical"],
      optedInIncidentTypes: ["injured_animal"],
    });

    expect(upsert).toHaveBeenCalledWith({
      organization_id: "org-1",
      is_currently_available: true,
      hours_text: undefined,
      opted_in_urgency_levels: ["critical"],
      opted_in_incident_types: ["injured_animal"],
    });
  });
});

describe("getOrganizationAvailability", () => {
  it("filters by organization_id and returns at most one row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    await getOrganizationAvailability(client, "org-1");
    expect(eq).toHaveBeenCalledWith("organization_id", "org-1");
  });
});

describe("listOrganizationServices", () => {
  it("filters by organization_id, oldest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    await listOrganizationServices(client, "org-1");
    expect(eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("createPlacementRequest", () => {
  it("stamps requested_by from the actor, never trusting the input for it", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "req-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const client = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await createPlacementRequest(client, "creator-1", {
      caseId: "case-1",
      fosterProfileId: "foster-1",
    });

    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      foster_profile_id: "foster-1",
      requested_by: "creator-1",
    });
  });
});

describe("respondToPlacementRequest", () => {
  it("stamps decided_by from the actor and sets decided_at", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await respondToPlacementRequest(
      client,
      "foster-user-1",
      "req-1",
      "approved",
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        decided_by: "foster-user-1",
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", "req-1");
  });
});

describe("listVerifiedDirectory", () => {
  it("calls the list_verified_directory RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await listVerifiedDirectory(client);
    expect(rpc).toHaveBeenCalledWith("list_verified_directory");
  });
});

describe("getFosterAddress", () => {
  it("calls get_foster_address with the foster profile id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await getFosterAddress(client, "foster-1");
    expect(rpc).toHaveBeenCalledWith("get_foster_address", {
      p_foster_profile_id: "foster-1",
    });
  });
});
