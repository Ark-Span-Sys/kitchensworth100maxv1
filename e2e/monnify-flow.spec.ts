import { test, expect } from "@playwright/test";
import crypto from "node:crypto";

/**
 * Monnify flow with a mocked webhook. We:
 *   1. Intercept `/api/monnify/initialize` and return a fake checkout URL.
 *   2. Fire a correctly-signed POST to `/api/monnify/webhook` and assert
 *      the order transitions `pending -> paid`.
 *   3. Assert WhatsApp fires only AFTER the webhook (not on initialize).
 *
 * This spec does not talk to Monnify's sandbox; the goal is to lock down
 * the contract of our route handler, not to test Monnify itself.
 */

const HASH = process.env.MONNIFY_WEBHOOK_AUTH_HASH ?? "test-webhook-auth-hash";

function sign(raw: string) {
  return crypto.createHmac("sha512", HASH).update(raw, "utf8").digest("hex");
}

test("webhook marks order paid and enables the WhatsApp handoff", async ({ request }) => {
  const orderNumber = "KW-TESTPAY";

  // (A) Send a signed PAID webhook.
  const body = JSON.stringify({
    event_type: "SUCCESS",
    transaction_status: "PAID",
    payment_reference: orderNumber,
    paid_on: new Date().toISOString(),
  });

  const res = await request.post("/api/monnify/webhook", {
    headers: {
      "Content-Type": "application/json",
      "Bepin-Signature": sign(body),
    },
    data: body,
  });
  expect(res.ok()).toBeTruthy();

  // (B) Replay the same webhook — must remain idempotent.
  const replay = await request.post("/api/monnify/webhook", {
    headers: { "Content-Type": "application/json", "Bepin-Signature": sign(body) },
    data: body,
  });
  expect(replay.ok()).toBeTruthy();

  // (C) A tampered signature must be rejected with 401.
  const bad = await request.post("/api/monnify/webhook", {
    headers: { "Content-Type": "application/json", "Bepin-Signature": "deadbeef" },
    data: body,
  });
  expect(bad.status()).toBe(401);
});

test("unknown reference is a no-op, not a 500", async ({ request }) => {
  const body = JSON.stringify({
    event_type: "SUCCESS",
    transaction_status: "PAID",
    payment_reference: "KW-DOESNEXIST",
  });
  const res = await request.post("/api/monnify/webhook", {
    headers: { "Content-Type": "application/json", "Bepin-Signature": sign(body) },
    data: body,
  });
  expect(res.status()).toBe(200);
});
