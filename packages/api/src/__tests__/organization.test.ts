import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  createOrganization,
  updateOrganization,
  confirmOrganizationListing,
  listMyOrganizations,
  listOrganizationMembers,
  addOrganizationMember,
  removeOrganizationMember,
  upsertOrganizationService,
  removeOrganizationService,
  setOrganizationAvailability,
  getOrganizationAvailability,
  listOrganizationServices,
  createFosterProfile,
  updateFosterProfile,
  getMyFosterProfile,
  listActiveFosterProfiles,
  createPlacementRequest,
  withdrawPlacementRequest,
  respondToPlacementRequest,
  listPlacementRequestsForFoster,
  listPlacementRequestsForCase,
  listVerifiedDirectory,
  getFosterAddress,
} from "../organization";

/** A table-query chain where every method records its call and
 * returns the same chainable object, which also resolves via `.then`. */
function makeChainRecorder(
  result: { data: unknown; error: unknown } = { data: [], error: null },
) {
  const calls: { method: string; args: unknown[] }[] = [];
  const proxy: Record<string, unknown> = {};
  const handler =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return proxy;
    };
  for (const method of [
    "select",
    "eq",
    "order",
    "insert",
    "update",
    "delete",
    "upsert",
    "single",
    "maybeSingle",
  ]) {
    proxy[method] = vi.fn(handler(method));
  }
  proxy.then = (resolve: (v: typeof result) => void) => resolve(result);
  return { proxy, calls };
}

function mockFromClient(result?: { data: unknown; error: unknown }) {
  const { proxy, calls } = makeChainRecorder(result);
  const from = vi.fn(() => proxy);
  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, from, calls };
}

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

describe("updateOrganization", () => {
  it("updates the editable profile fields by id", async () => {
    const { client, calls } = mockFromClient();
    await updateOrganization(client, "org-1", {
      serviceArea: "Dhanmondi",
      contactMethod: "phone",
      description: "A clinic",
    });
    expect(
      calls.some(
        (c) =>
          c.method === "update" &&
          (c.args[0] as { service_area: string }).service_area === "Dhanmondi",
      ),
    ).toBe(true);
    expect(calls.some((c) => c.method === "eq" && c.args[1] === "org-1")).toBe(
      true,
    );
  });
});

describe("confirmOrganizationListing", () => {
  it("wraps confirm_organization_listing", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    await confirmOrganizationListing(client, "org-1");
    expect(rpc).toHaveBeenCalledWith("confirm_organization_listing", {
      p_organization_id: "org-1",
    });
  });
});

describe("listMyOrganizations / listOrganizationMembers", () => {
  it("each query their own table filtered appropriately", async () => {
    const { client, from, calls } = mockFromClient();
    await listMyOrganizations(client, "user-1");
    expect(from).toHaveBeenCalledWith("organization_members");
    expect(calls.some((c) => c.method === "eq" && c.args[1] === "user-1")).toBe(
      true,
    );

    const { client: client2, calls: calls2 } = mockFromClient();
    await listOrganizationMembers(client2, "org-1");
    expect(calls2.some((c) => c.method === "eq" && c.args[1] === "org-1")).toBe(
      true,
    );
  });
});

describe("addOrganizationMember / removeOrganizationMember", () => {
  it("insert and delete named member rows, never a shared credential", async () => {
    const { client, calls } = mockFromClient();
    await addOrganizationMember(client, "org-1", "user-1");
    expect(
      calls.some(
        (c) =>
          c.method === "insert" &&
          (c.args[0] as { user_id: string }).user_id === "user-1",
      ),
    ).toBe(true);

    const { client: client2, calls: calls2 } = mockFromClient();
    await removeOrganizationMember(client2, "org-1", "user-1");
    expect(calls2.some((c) => c.method === "delete")).toBe(true);
    expect(calls2.filter((c) => c.method === "eq").length).toBe(2);
  });
});

describe("upsertOrganizationService / removeOrganizationService", () => {
  it("insert a service and delete one by id", async () => {
    const { client, calls } = mockFromClient();
    await upsertOrganizationService(client, "org-1", {
      serviceName: "Free deworming",
    });
    expect(
      calls.some(
        (c) =>
          c.method === "insert" &&
          (c.args[0] as { service_name: string }).service_name ===
            "Free deworming",
      ),
    ).toBe(true);

    const { client: client2, calls: calls2 } = mockFromClient();
    await removeOrganizationService(client2, "service-1");
    expect(calls2.some((c) => c.method === "delete")).toBe(true);
    expect(calls2.some((c) => c.args[1] === "service-1")).toBe(true);
  });
});

describe("foster profile wrappers", () => {
  it("create, update, and list foster profiles", async () => {
    const { client, calls } = mockFromClient({
      data: { id: "foster-1" },
      error: null,
    });
    await createFosterProfile(client, "user-1", {
      capacity: 2,
      isActive: true,
    });
    expect(
      calls.some(
        (c) =>
          c.method === "insert" &&
          (c.args[0] as { user_id: string }).user_id === "user-1",
      ),
    ).toBe(true);

    const { client: client2, calls: calls2 } = mockFromClient();
    await updateFosterProfile(client2, "foster-1", {
      capacity: 3,
      isActive: false,
    });
    expect(calls2.some((c) => c.method === "update")).toBe(true);

    const { client: client3, from: from3 } = mockFromClient();
    await getMyFosterProfile(client3, "user-1");
    expect(from3).toHaveBeenCalledWith("foster_profiles");

    const { client: client4, calls: calls4 } = mockFromClient();
    await listActiveFosterProfiles(client4);
    expect(
      calls4.some((c) => c.method === "eq" && c.args[0] === "is_active"),
    ).toBe(true);
  });
});

describe("placement request wrappers", () => {
  it("withdraw and list placement requests", async () => {
    const { client, calls } = mockFromClient();
    await withdrawPlacementRequest(client, "request-1");
    expect(
      calls.some(
        (c) =>
          c.method === "update" &&
          (c.args[0] as { status: string }).status === "withdrawn",
      ),
    ).toBe(true);

    const { client: client2, calls: calls2 } = mockFromClient();
    await listPlacementRequestsForFoster(client2, "foster-1");
    expect(
      calls2.some((c) => c.method === "eq" && c.args[1] === "foster-1"),
    ).toBe(true);

    const { client: client3, calls: calls3 } = mockFromClient();
    await listPlacementRequestsForCase(client3, "case-1");
    expect(
      calls3.some((c) => c.method === "eq" && c.args[1] === "case-1"),
    ).toBe(true);
  });
});
