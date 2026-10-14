import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import {
  createCase,
  findCaseIdByPublicReference,
  findNearbyDuplicateCases,
  getCaseExactLocation,
  getCaseMediaSignedUrl,
  listCaseMedia,
  uploadCaseMedia,
} from "../case";

const location = { latitude: 23.7461, longitude: 90.3742 };

describe("createCase", () => {
  it("converts lat/lng to WKT and forwards p_-prefixed args, passing null (not undefined) for absent optional fields", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await createCase(client, {
      idempotencyKey: "c100f342-7586-458f-b912-f4db3934a1f4",
      incidentType: "injured_animal",
      urgency: "urgent",
      description: "Limping dog",
      location,
      creatorOnSite: true,
      hazardFlags: [],
    });

    expect(rpc).toHaveBeenCalledWith("create_case", {
      p_idempotency_key: "c100f342-7586-458f-b912-f4db3934a1f4",
      p_incident_type: "injured_animal",
      p_urgency: "urgent",
      p_animal_type_id: null,
      p_description: "Limping dog",
      p_location: "SRID=4326;POINT(90.3742 23.7461)",
      p_landmark: null,
      p_division: null,
      p_district: null,
      p_upazila_or_thana: null,
      p_creator_on_site: true,
      p_last_seen_at: undefined,
      p_hazard_flags: [],
    });
  });

  it("forwards reported hazard flags (PRD 12.1)", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await createCase(client, {
      idempotencyKey: "c100f342-7586-458f-b912-f4db3934a1f4",
      incidentType: "road_accident",
      urgency: "critical",
      description: "Dog hit near a busy road",
      location,
      creatorOnSite: true,
      hazardFlags: ["traffic", "electrical"],
    });

    expect(rpc).toHaveBeenCalledWith(
      "create_case",
      expect.objectContaining({ p_hazard_flags: ["traffic", "electrical"] }),
    );
  });
});

describe("findNearbyDuplicateCases", () => {
  it("converts lat/lng to WKT and forwards the radius/timeframe options", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;

    await findNearbyDuplicateCases(client, location, {
      radiusMeters: 200,
      sinceMinutes: 60,
    });

    expect(rpc).toHaveBeenCalledWith("find_nearby_duplicate_cases", {
      p_location: "SRID=4326;POINT(90.3742 23.7461)",
      p_radius_meters: 200,
      p_since_minutes: 60,
    });
  });
});

describe("uploadCaseMedia", () => {
  it("stops before inserting rescue_media if the storage upload fails", async () => {
    const upload = vi
      .fn()
      .mockResolvedValue({ error: { message: "network error" } });
    const insert = vi.fn();
    const client = {
      storage: { from: () => ({ upload }) },
      from: insert,
    } as unknown as SupabaseClient<Database>;

    const result = await uploadCaseMedia(client, {
      caseId: "case-1",
      uploaderId: "user-1",
      mediaId: "media-1",
      fileExtension: "jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result).toEqual({ data: null, error: { message: "network error" } });
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts rescue_media with exif_stripped: true and the case/media storage path after a successful upload", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "media-row-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const client = {
      storage: { from: () => ({ upload }) },
      from: () => ({ insert }),
    } as unknown as SupabaseClient<Database>;

    const result = await uploadCaseMedia(client, {
      caseId: "case-1",
      uploaderId: "user-1",
      mediaId: "media-1",
      fileExtension: "jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(upload).toHaveBeenCalledWith(
      "case-1/media-1.jpg",
      expect.anything(),
      {
        contentType: "image/jpeg",
      },
    );
    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      uploader_id: "user-1",
      storage_path: "case-1/media-1.jpg",
      exif_stripped: true,
      is_graphic: false,
    });
    expect(result).toEqual({ data: { id: "media-row-1" }, error: null });
  });

  it("forwards updateId when attaching media to an official update", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "media-row-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const client = {
      storage: { from: () => ({ upload }) },
      from: () => ({ insert }),
    } as unknown as SupabaseClient<Database>;

    await uploadCaseMedia(client, {
      caseId: "case-1",
      uploaderId: "user-1",
      mediaId: "media-1",
      fileExtension: "jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([1, 2, 3]),
      updateId: "update-1",
    });

    expect(insert).toHaveBeenCalledWith({
      case_id: "case-1",
      update_id: "update-1",
      uploader_id: "user-1",
      storage_path: "case-1/media-1.jpg",
      exif_stripped: true,
      is_graphic: false,
    });
  });
});

describe("listCaseMedia", () => {
  it("filters by case id, oldest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    await listCaseMedia(client, "case-1");
    expect(eq).toHaveBeenCalledWith("case_id", "case-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("getCaseMediaSignedUrl", () => {
  it("requests a signed URL from the rescue-media bucket", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: "https://x" }, error: null });
    const client = {
      storage: { from: () => ({ createSignedUrl }) },
    } as unknown as SupabaseClient<Database>;

    const result = await getCaseMediaSignedUrl(
      client,
      "case-1/media-1.jpg",
      120,
    );

    expect(createSignedUrl).toHaveBeenCalledWith("case-1/media-1.jpg", 120);
    expect(result).toEqual({ data: { signedUrl: "https://x" }, error: null });
  });
});

describe("findCaseIdByPublicReference", () => {
  it("filters by trimmed public_reference", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "case-1" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = {
      from: vi.fn(() => ({ select })),
    } as unknown as SupabaseClient<Database>;

    await findCaseIdByPublicReference(client, "  RA-ABCD1234  ");
    expect(eq).toHaveBeenCalledWith("public_reference", "RA-ABCD1234");
  });
});

describe("getCaseExactLocation", () => {
  it("unwraps the single-row table response into a plain object", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ latitude: 23.7461, longitude: 90.3742 }],
      error: null,
    });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    const result = await getCaseExactLocation(client, "case-1");

    expect(rpc).toHaveBeenCalledWith("get_case_exact_location", {
      p_case_id: "case-1",
    });
    expect(result).toEqual({
      data: { latitude: 23.7461, longitude: 90.3742 },
      error: null,
    });
  });

  it("returns null data when the caller is not authorized (no row)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;

    const result = await getCaseExactLocation(client, "case-1");
    expect(result).toEqual({ data: null, error: null });
  });
});
