import {
  buildPushMessage,
  fetchReceipts,
  sendPushMessages,
  type ClaimedDelivery,
  type FetchLike,
} from "./expo.ts";

type RpcResult = { data: unknown; error: { message: string } | null };

export interface DispatchDeps {
  rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<RpcResult>;
  fetch: FetchLike;
  expoAccessToken?: string;
}

export interface DispatchSummary {
  alerts: number;
  queued: number;
  sent: number;
  receiptsChecked: number;
  errors: string[];
}

async function call<T>(
  deps: DispatchDeps,
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await deps.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as T;
}

// One dispatcher pass: match and escalate, queue pushes, send them,
// then check receipts of earlier sends. Each stage runs on its own so a
// failure in one never blocks the others, and none of it sits on the
// case-creation path, so a failure here cannot undo a created case.
export async function runDispatch(
  deps: DispatchDeps,
): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    alerts: 0,
    queued: 0,
    sent: 0,
    receiptsChecked: 0,
    errors: [],
  };

  const stage = async (name: string, work: () => Promise<void>) => {
    try {
      await work();
    } catch (err) {
      summary.errors.push(
        `${name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  await stage("match", async () => {
    summary.alerts = await call<number>(deps, "dispatch_all_case_alerts");
  });

  await stage("queue", async () => {
    summary.queued = await call<number>(deps, "queue_notification_deliveries");
  });

  await stage("send", async () => {
    const claimed = await call<ClaimedDelivery[]>(
      deps,
      "claim_pending_deliveries",
      {
        p_limit: 100,
      },
    );
    if (claimed.length === 0) return;
    const results = await sendPushMessages(
      deps.fetch,
      claimed.map(buildPushMessage),
      deps.expoAccessToken,
    );
    await call(deps, "record_delivery_results", {
      p_results: claimed.map((row, i) => ({
        delivery_id: row.delivery_id,
        ticket_id: results[i]?.ticketId ?? null,
        error: results[i]?.error ?? null,
      })),
    });
    summary.sent = results.filter((r) => r.ticketId).length;
  });

  await stage("receipts", async () => {
    const due = await call<{ delivery_id: string; expo_ticket_id: string }[]>(
      deps,
      "claim_receipt_checks",
      { p_limit: 300 },
    );
    if (due.length === 0) return;
    const receipts = await fetchReceipts(
      deps.fetch,
      due.map((d) => d.expo_ticket_id),
      deps.expoAccessToken,
    );
    const results = due.flatMap((d) => {
      const receipt = receipts[d.expo_ticket_id];
      return receipt
        ? [
            {
              delivery_id: d.delivery_id,
              ok: receipt.ok,
              error: receipt.error ?? null,
            },
          ]
        : [];
    });
    if (results.length === 0) return;
    await call(deps, "record_receipt_results", { p_results: results });
    summary.receiptsChecked = results.length;
  });

  return summary;
}
