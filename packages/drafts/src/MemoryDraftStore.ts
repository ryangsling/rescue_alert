import type { CaseDraft } from "./caseDraft";
import type { DraftStore } from "./DraftStore";

/** Reference implementation used for tests (here and in each app) - never a real persistence layer. */
export class MemoryDraftStore implements DraftStore {
  private readonly drafts = new Map<string, CaseDraft>();

  async save(draft: CaseDraft): Promise<void> {
    this.drafts.set(draft.idempotencyKey, draft);
  }

  async get(idempotencyKey: string): Promise<CaseDraft | null> {
    return this.drafts.get(idempotencyKey) ?? null;
  }

  async list(): Promise<CaseDraft[]> {
    return [...this.drafts.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async delete(idempotencyKey: string): Promise<void> {
    this.drafts.delete(idempotencyKey);
  }
}
