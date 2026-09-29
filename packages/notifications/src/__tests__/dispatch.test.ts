import { describe, expect, it, vi } from "vitest";
import { runDispatch } from "../dispatch.ts";
import type { ClaimedDelivery } from "../expo.ts";

const claimed: ClaimedDelivery[] = [
  {
    delivery_id: "d1",
    expo_push_token: "ExponentPushToken[one]",
    language: "en",
    category: "new_critical_case_nearby",
    case_id: "c1",
    payload: {
      incident_type: "injured_animal",
      urgency: "critical",
      area: "Dhanmondi",
      distance_km: 1,
    },
  },
  {
    delivery_id: "d2",
    expo_push_token: "ExponentPushToken[two]",
    language: "bn",
    category: "case_closed",
    case_id: "c1",
    payload: { incident_type: "injured_animal" },
  },
];

function makeRpc(overrides: Record<string, unknown> = {}) {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  const rpc = (name: string, args?: Record<string, unknown>) => {
    calls.push({ name, args });
    const value = name in overrides ? overrides[name] : defaults[name];
    if (value instanceof Error) {
      return Promise.resolve({ data: null, error: { message: value.message } });
    }
    return Promise.resolve({ data: value ?? null, error: null });
  };
  const defaults: Record<string, unknown> = {
    dispatch_all_case_alerts: 3,
    queue_notification_deliveries: 2,
    claim_pending_deliveries: claimed,
    claim_receipt_checks: [],
  };
  return { rpc, calls };
}

const okFetch = () =>
  vi.fn((_url: string, init: { body: string }) => {
    const batch = JSON.parse(init.body) as unknown[];
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: batch.map((_, i) => ({ status: "ok", id: `t${i}` })),
        }),
    });
  });

describe("runDispatch", () => {
  it("matches, queues, sends in each recipient's language, and records tickets", async () => {
    const { rpc, calls } = makeRpc();
    const fetchFn = okFetch();
    const summary = await runDispatch({ rpc, fetch: fetchFn });

    expect(summary).toMatchObject({
      alerts: 3,
      queued: 2,
      sent: 2,
      errors: [],
    });
    const sent = JSON.parse(fetchFn.mock.calls[0]?.[1].body as string) as {
      title: string;
    }[];
    expect(sent[0]?.title).toContain("Critical");
    expect(sent[1]?.title).toBe("কেস বন্ধ হয়েছে");

    const record = calls.find((c) => c.name === "record_delivery_results");
    expect(record?.args?.p_results).toEqual([
      { delivery_id: "d1", ticket_id: "t0", error: null },
      { delivery_id: "d2", ticket_id: "t1", error: null },
    ]);
  });

  it("sends nothing when no delivery is pending", async () => {
    const { rpc } = makeRpc({ claim_pending_deliveries: [] });
    const fetchFn = okFetch();
    await runDispatch({ rpc, fetch: fetchFn });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("reports a rejected token to the database for removal", async () => {
    const { rpc, calls } = makeRpc();
    const fetchFn = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: [
              { status: "ok", id: "t0" },
              { status: "error", details: { error: "DeviceNotRegistered" } },
            ],
          }),
      }),
    );
    await runDispatch({ rpc, fetch: fetchFn });
    const record = calls.find((c) => c.name === "record_delivery_results");
    expect(record?.args?.p_results).toContainEqual({
      delivery_id: "d2",
      ticket_id: null,
      error: "DeviceNotRegistered",
    });
  });

  it("keeps later stages running when one stage fails", async () => {
    const { rpc, calls } = makeRpc({
      dispatch_all_case_alerts: new Error("db down"),
    });
    const summary = await runDispatch({ rpc, fetch: okFetch() });
    expect(summary.errors).toEqual([
      "match: dispatch_all_case_alerts: db down",
    ]);
    expect(summary.sent).toBe(2);
    expect(calls.map((c) => c.name)).toContain("claim_receipt_checks");
  });

  it("records receipts only for tickets Expo has answered", async () => {
    const { rpc, calls } = makeRpc({
      claim_pending_deliveries: [],
      claim_receipt_checks: [
        { delivery_id: "d1", expo_ticket_id: "a" },
        { delivery_id: "d2", expo_ticket_id: "b" },
      ],
    });
    const fetchFn = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              a: { status: "error", details: { error: "DeviceNotRegistered" } },
            },
          }),
      }),
    );
    const summary = await runDispatch({ rpc, fetch: fetchFn });
    expect(summary.receiptsChecked).toBe(1);
    expect(
      calls.find((c) => c.name === "record_receipt_results")?.args?.p_results,
    ).toEqual([{ delivery_id: "d1", ok: false, error: "DeviceNotRegistered" }]);
  });
});
