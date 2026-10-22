import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import { verifyWebhookSignature, isPaidEvent, type MonnifyWebhookPayload } from "../monnify";

/**
 * Route-handler level tests for the Monnify integration. We test the pure
 * helpers (`verifyWebhookSignature`, `isPaidEvent`) directly, because the
 * `/api/monnify/webhook` route is a thin wrapper around them + a Supabase
 * update — and mocking Supabase here would add noise without catching
 * more real bugs. E2E Playwright test in `e2e/monnify-flow.spec.ts`
 * exercises the route with a mocked webhook.
 */

const HASH = "test-webhook-auth-hash";

beforeAll(() => {
  process.env.MONNIFY_WEBHOOK_AUTH_HASH = HASH;
});

function sign(body: string): string {
  return crypto.createHmac("sha512", HASH).update(body, "utf8").digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly-signed payload", () => {
    const body = JSON.stringify({ event_type: "SUCCESS", payment_reference: "KW-ABC123" });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects a tampered body", () => {
    const original = JSON.stringify({ event_type: "SUCCESS", amount: 5000 });
    const tampered = JSON.stringify({ event_type: "SUCCESS", amount: 500000 });
    expect(verifyWebhookSignature(tampered, sign(original))).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature("{}", null)).toBe(false);
  });

  it("rejects a signature of the wrong length", () => {
    expect(verifyWebhookSignature("{}", "deadbeef")).toBe(false);
  });

  it("rejects when the env var is unset", () => {
    const saved = process.env.MONNIFY_WEBHOOK_AUTH_HASH;
    delete process.env.MONNIFY_WEBHOOK_AUTH_HASH;
    expect(verifyWebhookSignature("body", sign("body"))).toBe(false);
    process.env.MONNIFY_WEBHOOK_AUTH_HASH = saved;
  });
});

describe("isPaidEvent", () => {
  it("treats event_type=SUCCESS as paid", () => {
    expect(isPaidEvent({ event_type: "SUCCESS" } as MonnifyWebhookPayload)).toBe(true);
  });

  it("treats transaction_status=PAID as paid", () => {
    expect(isPaidEvent({ transaction_status: "PAID" } as MonnifyWebhookPayload)).toBe(true);
  });

  it("is case-insensitive for transaction_status", () => {
    expect(isPaidEvent({ transaction_status: "paid" } as MonnifyWebhookPayload)).toBe(true);
    expect(isPaidEvent({ transaction_status: "Approved" } as MonnifyWebhookPayload)).toBe(true);
  });

  it("rejects non-paid statuses", () => {
    expect(isPaidEvent({ transaction_status: "PENDING" } as MonnifyWebhookPayload)).toBe(false);
    expect(isPaidEvent({ transaction_status: "FAILED" } as MonnifyWebhookPayload)).toBe(false);
    expect(isPaidEvent({ event_type: "FAILURE" } as MonnifyWebhookPayload)).toBe(false);
  });

  it("rejects an empty payload", () => {
    expect(isPaidEvent({} as MonnifyWebhookPayload)).toBe(false);
  });
});
