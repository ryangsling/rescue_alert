import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "../caseDraft";
import { MemoryDraftStore } from "../MemoryDraftStore";

describe("MemoryDraftStore", () => {
  it("round-trips a saved draft through get()", async () => {
    const store = new MemoryDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    expect(await store.get(draft.idempotencyKey)).toEqual(draft);
  });

  it("returns null for a draft that was never saved", async () => {
    const store = new MemoryDraftStore();
    expect(await store.get("c100f342-7586-458f-b912-f4db3934a1f4")).toBeNull();
  });

  it("lists drafts most-recently-updated first", async () => {
    const store = new MemoryDraftStore();
    const older = {
      ...createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4"),
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const newer = {
      ...createEmptyDraft("c9455f13-2062-452c-9deb-be06e4bc0668"),
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    await store.save(older);
    await store.save(newer);
    const list = await store.list();
    expect(list.map((d) => d.idempotencyKey)).toEqual([
      newer.idempotencyKey,
      older.idempotencyKey,
    ]);
  });

  it("deletes a draft", async () => {
    const store = new MemoryDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    await store.delete(draft.idempotencyKey);
    expect(await store.get(draft.idempotencyKey)).toBeNull();
  });

  it("save() overwrites an existing draft with the same idempotencyKey", async () => {
    const store = new MemoryDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    await store.save({ ...draft, currentStep: 3 });
    expect((await store.get(draft.idempotencyKey))?.currentStep).toBe(3);
    expect(await store.list()).toHaveLength(1);
  });
});
