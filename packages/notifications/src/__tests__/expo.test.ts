import { describe, expect, it, vi } from "vitest";
import {
  buildPushMessage,
  fetchReceipts,
  sendPushMessages,
  type ClaimedDelivery,
  type FetchLike,
  type PushMessage,
} from "../expo.ts";

const row: ClaimedDelivery = {
  delivery_id: "d1",
  expo_push_token: "ExponentPushToken[abc]",
  language: "en",
  category: "new_critical_case_nearby",
  case_id: "11111111-1111-1111-1111-111111111111",
  payload: {
    incident_type: "injured_animal",
    urgency: "critical",
    area: "Dhanmondi",
    distance_km: 1.2,
  },
};

const respond = (
  body: unknown,
  ok = true,
  status = 200,
): ReturnType<FetchLike> =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

describe("buildPushMessage", () => {
  it("carries a deep link to the case and only the case id and category as data", () => {
    const message = buildPushMessage(row);
    expect(message.to).toBe("ExponentPushToken[abc]");
    expect(message.data).toEqual({
      caseId: row.case_id,
      category: "new_critical_case_nearby",
      url: `rescuealert://case/${row.case_id}`,
    });
  });

  it("has no deep link when the notification has no case", () => {
    const message = buildPushMessage({
      ...row,
      case_id: null,
      category: "moderation_or_account",
    });
    expect(message.data.url).toBeNull();
  });

  it("puts no coordinate-shaped or phone-shaped text on the lock screen", () => {
    const message = buildPushMessage(row);
    expect(JSON.stringify(message)).not.toMatch(/\d{2}\.\d{4,}|\+8801/);
  });
});

describe("sendPushMessages", () => {
  const messages = (n: number): PushMessage[] =>
    Array.from({ length: n }, () => buildPushMessage(row));

  it("splits into chunks of 100 and keeps result order", async () => {
    let counter = 0;
    const fetchFn = vi.fn((_url: string, init: { body: string }) => {
      const batch = JSON.parse(init.body) as unknown[];
      return respond({
        data: batch.map(() => ({ status: "ok", id: `t${counter++}` })),
      });
    });
    const results = await sendPushMessages(fetchFn, messages(250));
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(250);
    expect(results[0]).toEqual({ ticketId: "t0" });
    expect(results[249]).toEqual({ ticketId: "t249" });
  });

  it("maps a per-message error, including DeviceNotRegistered", async () => {
    const fetchFn = vi.fn(() =>
      respond({
        data: [
          { status: "ok", id: "t1" },
          {
            status: "error",
            message: "gone",
            details: { error: "DeviceNotRegistered" },
          },
          { status: "error", message: "boom" },
        ],
      }),
    );
    const results = await sendPushMessages(fetchFn, messages(3));
    expect(results).toEqual([
      { ticketId: "t1" },
      { error: "DeviceNotRegistered" },
      { error: "send_failed" },
    ]);
  });

  it("marks the whole chunk send_failed on an HTTP error or network failure", async () => {
    const httpError = vi.fn(() => respond({}, false, 503));
    expect(await sendPushMessages(httpError, messages(2))).toEqual([
      { error: "send_failed" },
      { error: "send_failed" },
    ]);
    const networkError = vi.fn(() => Promise.reject(new Error("offline")));
    expect(await sendPushMessages(networkError, messages(1))).toEqual([
      { error: "send_failed" },
    ]);
  });

  it("sends the access token only when configured", async () => {
    const fetchFn = vi.fn(
      (...args: [string, { headers: Record<string, string> }]) =>
        args && respond({ data: [{ status: "ok", id: "t" }] }),
    );
    await sendPushMessages(fetchFn, messages(1), "secret");
    expect(fetchFn.mock.calls[0]?.[1].headers.Authorization).toBe(
      "Bearer secret",
    );
    await sendPushMessages(fetchFn, messages(1));
    expect(fetchFn.mock.calls[1]?.[1].headers.Authorization).toBeUndefined();
  });
});

describe("fetchReceipts", () => {
  it("maps ok and error receipts and skips ids Expo does not have yet", async () => {
    const fetchFn = vi.fn(() =>
      respond({
        data: {
          a: { status: "ok" },
          b: { status: "error", details: { error: "DeviceNotRegistered" } },
        },
      }),
    );
    const receipts = await fetchReceipts(fetchFn, ["a", "b", "c"]);
    expect(receipts).toEqual({
      a: { ok: true },
      b: { ok: false, error: "DeviceNotRegistered" },
    });
  });

  it("returns nothing on failure instead of throwing", async () => {
    expect(
      await fetchReceipts(() => Promise.reject(new Error("x")), ["a"]),
    ).toEqual({});
  });
});
