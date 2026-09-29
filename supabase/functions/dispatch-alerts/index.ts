// Part 11: one dispatcher pass, called every minute by pg_cron via pg_net.
//
// Not user-facing, so it does not use a user JWT: the caller proves
// itself with a shared secret header (DISPATCH_SECRET), and the work
// itself runs with the service-role key against service-role-only SQL
// functions. It answers 202 immediately and does the work as a
// background task, so a slow push provider never holds the cron request.
//
// Case creation never calls this. If it fails, cases are unaffected and
// the next run picks the work up again.
import { createClient } from "npm:@supabase/supabase-js@2";
import { runDispatch } from "../../../packages/notifications/src/dispatch.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve((req) => {
  const secret = Deno.env.get("DISPATCH_SECRET");
  const provided = req.headers.get("x-dispatch-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default,
    { auth: { persistSession: false } },
  );

  EdgeRuntime.waitUntil(
    runDispatch({
      rpc: (name, args) => client.rpc(name, args),
      fetch: (url, init) => fetch(url, init),
      expoAccessToken: Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
    })
      .then((summary) => console.log(JSON.stringify(summary)))
      .catch((err) => console.error("dispatch failed", err)),
  );

  return Response.json({ status: "accepted" }, { status: 202 });
});
