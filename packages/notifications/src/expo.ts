import {
  renderNotification,
  type Locale,
  type NotificationCategory,
  type NotificationPayload,
} from "./messages.ts";

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo accepts at most 100 messages per send and 300 ids per receipt call.
const SEND_CHUNK = 100;
const RECEIPT_CHUNK = 300;

// A nearby alert that cannot be delivered within six hours is stale.
const TTL_SECONDS = 6 * 60 * 60;

export interface ClaimedDelivery {
  delivery_id: string;
  expo_push_token: string;
  language: Locale;
  category: NotificationCategory;
  case_id: string | null;
  payload: NotificationPayload;
}

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  // Deep link data: the app opens the case from this on a cold start.
  data: {
    caseId: string | null;
    category: NotificationCategory;
    url: string | null;
  };
  sound: "default";
  priority: "high";
  ttl: number;
}

export interface SendResult {
  ticketId?: string;
  error?: string;
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export function buildPushMessage(row: ClaimedDelivery): PushMessage {
  const { title, body } = renderNotification(
    row.language,
    row.category,
    row.payload,
  );
  return {
    to: row.expo_push_token,
    title,
    body,
    data: {
      caseId: row.case_id,
      category: row.category,
      url: row.case_id ? `rescuealert://case/${row.case_id}` : null,
    },
    sound: "default",
    priority: "high",
    ttl: TTL_SECONDS,
  };
}

function headers(accessToken?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  details?: { error?: string };
}

// Results line up one-to-one with the input messages. A failed request
// marks every message in its chunk as send_failed so the database can
// retry them; it never throws.
export async function sendPushMessages(
  fetchFn: FetchLike,
  messages: PushMessage[],
  accessToken?: string,
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (const batch of chunk(messages, SEND_CHUNK)) {
    try {
      const res = await fetchFn(EXPO_PUSH_URL, {
        method: "POST",
        headers: headers(accessToken),
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(`expo responded ${res.status}`);
      const { data } = (await res.json()) as { data: ExpoTicket[] };
      for (let i = 0; i < batch.length; i++) {
        const ticket = data[i];
        if (ticket?.status === "ok" && ticket.id)
          results.push({ ticketId: ticket.id });
        else results.push({ error: ticket?.details?.error ?? "send_failed" });
      }
    } catch {
      for (let i = 0; i < batch.length; i++)
        results.push({ error: "send_failed" });
    }
  }
  return results;
}

export interface ReceiptResult {
  ok: boolean;
  error?: string;
}

// Receipts Expo does not have yet are simply absent from the result and
// get asked for again on a later run.
export async function fetchReceipts(
  fetchFn: FetchLike,
  ticketIds: string[],
  accessToken?: string,
): Promise<Record<string, ReceiptResult>> {
  const receipts: Record<string, ReceiptResult> = {};
  for (const ids of chunk(ticketIds, RECEIPT_CHUNK)) {
    try {
      const res = await fetchFn(EXPO_RECEIPTS_URL, {
        method: "POST",
        headers: headers(accessToken),
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) continue;
      const { data } = (await res.json()) as {
        data: Record<string, ExpoTicket>;
      };
      for (const [id, receipt] of Object.entries(data ?? {})) {
        receipts[id] =
          receipt.status === "ok"
            ? { ok: true }
            : { ok: false, error: receipt.details?.error ?? "receipt_error" };
      }
    } catch {
      continue;
    }
  }
  return receipts;
}
