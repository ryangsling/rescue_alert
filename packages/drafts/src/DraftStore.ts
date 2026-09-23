import type { CaseDraft } from "./caseDraft";

/**
 * CASE-001: local draft persistence. One interface, two real
 * implementations - Expo SQLite on mobile, IndexedDB on web (Storage
 * choice per AGENTS.md's tech stack table) - so the report wizard UI
 * (built against this interface) is identical on both platforms.
 */
export interface DraftStore {
  save(draft: CaseDraft): Promise<void>;
  get(idempotencyKey: string): Promise<CaseDraft | null>;
  list(): Promise<CaseDraft[]>;
  delete(idempotencyKey: string): Promise<void>;
}
