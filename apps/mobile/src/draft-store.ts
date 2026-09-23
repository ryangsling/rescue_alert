import * as SQLite from "expo-sqlite";
import type { CaseDraft, DraftStore } from "@rescue-alert/drafts";

/**
 * Lazily opened (not at module scope) - `expo export --platform web`
 * statically prerenders every route in a Node environment with no
 * `window`/IndexedDB, the same class of crash already proven this
 * session for a module-scope AsyncStorage reference in
 * supabase-client.ts. Opening the DB only when a real method is
 * called (from a component effect/handler, never at import time)
 * avoids it the same way.
 */
let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;

async function getDb() {
  dbPromise ??= SQLite.openDatabaseAsync("case_drafts.db").then(async (db) => {
    await db.execAsync(
      "CREATE TABLE IF NOT EXISTS case_drafts (idempotency_key TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL);",
    );
    return db;
  });
  return dbPromise;
}

/** A single JSON `data` column, not one column per CaseDraft field: the draft shape is expected to grow as later Part 8 UI work adds fields, and this avoids a SQLite schema migration for each one. */
export class SqliteDraftStore implements DraftStore {
  async save(draft: CaseDraft): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO case_drafts (idempotency_key, data, updated_at) VALUES (?, ?, ?)",
      draft.idempotencyKey,
      JSON.stringify(draft),
      draft.updatedAt,
    );
  }

  async get(idempotencyKey: string): Promise<CaseDraft | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ data: string }>(
      "SELECT data FROM case_drafts WHERE idempotency_key = ?",
      idempotencyKey,
    );
    return row ? (JSON.parse(row.data) as CaseDraft) : null;
  }

  async list(): Promise<CaseDraft[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ data: string }>(
      "SELECT data FROM case_drafts ORDER BY updated_at DESC",
    );
    return rows.map((row) => JSON.parse(row.data) as CaseDraft);
  }

  async delete(idempotencyKey: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "DELETE FROM case_drafts WHERE idempotency_key = ?",
      idempotencyKey,
    );
  }
}

export const draftStore: DraftStore = new SqliteDraftStore();
