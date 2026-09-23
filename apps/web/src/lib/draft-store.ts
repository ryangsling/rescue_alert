import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CaseDraft, DraftStore } from "@rescue-alert/drafts";

interface CaseDraftsDb extends DBSchema {
  case_drafts: {
    key: string;
    value: CaseDraft;
    indexes: { updatedAt: string };
  };
}

/**
 * Lazily opened, not at module scope - this file can be imported from
 * a Server Component tree during Next.js's SSR/static-generation
 * pass, where indexedDB doesn't exist. Opening only on first real
 * method call (from a Client Component effect/handler) avoids the
 * same class of crash already proven this session for a module-scope
 * AsyncStorage reference on the mobile side.
 */
let dbPromise: Promise<IDBPDatabase<CaseDraftsDb>> | null = null;

function getDb(): Promise<IDBPDatabase<CaseDraftsDb>> {
  dbPromise ??= openDB<CaseDraftsDb>("case_drafts", 1, {
    upgrade(db) {
      const store = db.createObjectStore("case_drafts", {
        keyPath: "idempotencyKey",
      });
      store.createIndex("updatedAt", "updatedAt");
    },
  });
  return dbPromise;
}

/**
 * Test-only: an open connection blocks IndexedDB's own deleteDB()
 * from ever resolving (proven directly - a test suite's afterEach
 * hung until this was added), which real app code never needs to
 * care about since it keeps one connection open for the app's
 * lifetime by design. Not exported from index.ts / used outside tests.
 */
export async function __closeDraftDbForTests(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = null;
  }
}

export class IndexedDbDraftStore implements DraftStore {
  async save(draft: CaseDraft): Promise<void> {
    const db = await getDb();
    await db.put("case_drafts", draft);
  }

  async get(idempotencyKey: string): Promise<CaseDraft | null> {
    const db = await getDb();
    return (await db.get("case_drafts", idempotencyKey)) ?? null;
  }

  async list(): Promise<CaseDraft[]> {
    const db = await getDb();
    const drafts = await db.getAllFromIndex("case_drafts", "updatedAt");
    return drafts.reverse();
  }

  async delete(idempotencyKey: string): Promise<void> {
    const db = await getDb();
    await db.delete("case_drafts", idempotencyKey);
  }
}

export const draftStore: DraftStore = new IndexedDbDraftStore();
