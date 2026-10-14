import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@rescue-alert/types";

/**
 * Part 18 (OFF-003-ish territory): a minimal local cache of the last
 * few cases actually opened, so a case summary is still visible after
 * a connectivity loss even before the feed re-fetches. Deliberately
 * NOT a snapshot of live case state (status/needs can go stale) -
 * only the handful of fields that are true regardless of what has
 * happened to the case since: title, urgency, and when it was viewed.
 * Opening it from this list always re-fetches the real case.
 */
export interface RecentlyViewedCase {
  id: string;
  publicReference: string;
  title: string;
  urgency: Database["public"]["Enums"]["urgency_level"];
  viewedAt: string;
}

const STORAGE_KEY = "rescue-alert-recently-viewed";
const MAX_ENTRIES = 10;

export async function recordCaseView(
  entry: Omit<RecentlyViewedCase, "viewedAt">,
): Promise<void> {
  const current = await listRecentlyViewedCases();
  const next = [
    { ...entry, viewedAt: new Date().toISOString() },
    ...current.filter((c) => c.id !== entry.id),
  ].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function listRecentlyViewedCases(): Promise<RecentlyViewedCase[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentlyViewedCase[];
  } catch {
    return [];
  }
}
