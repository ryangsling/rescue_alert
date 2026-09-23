import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import { createEmptyDraft } from "@rescue-alert/drafts";
import { __closeDraftDbForTests, IndexedDbDraftStore } from "../draft-store";

// A real IndexedDB implementation (fake-indexeddb), not a mock of
// IndexedDbDraftStore's own methods - this proves the actual
// openDB/put/get/getAllFromIndex/delete calls work together, not just
// that this class calls some functions.
//
// The module caches one open connection for the app's lifetime (by
// design - see draft-store.ts). deleteDB() hangs forever while a
// connection is still open (proven directly: every test here timed
// out until the close call below was added), so each test's leftover
// connection must be closed first.
afterEach(async () => {
  await __closeDraftDbForTests();
  await deleteDB("case_drafts");
});

describe("IndexedDbDraftStore", () => {
  it("round-trips a saved draft through get()", async () => {
    const store = new IndexedDbDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    expect(await store.get(draft.idempotencyKey)).toEqual(draft);
  });

  it("returns null for a draft that was never saved", async () => {
    const store = new IndexedDbDraftStore();
    expect(await store.get("c100f342-7586-458f-b912-f4db3934a1f4")).toBeNull();
  });

  it("lists drafts most-recently-updated first", async () => {
    const store = new IndexedDbDraftStore();
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
    const store = new IndexedDbDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    await store.delete(draft.idempotencyKey);
    expect(await store.get(draft.idempotencyKey)).toBeNull();
  });

  it("save() overwrites an existing draft with the same idempotencyKey", async () => {
    const store = new IndexedDbDraftStore();
    const draft = createEmptyDraft("c100f342-7586-458f-b912-f4db3934a1f4");
    await store.save(draft);
    await store.save({ ...draft, currentStep: 3 });
    expect((await store.get(draft.idempotencyKey))?.currentStep).toBe(3);
    expect(await store.list()).toHaveLength(1);
  });
});
