import crypto from "node:crypto";

/**
 * Monnify API client (v1) for Kitchen's Worth.
 * Docs: https://docs.monnify.com/api/
 *
 * Auth: HTTP Basic with `secretKey:` (trailing colon).
 * Webhook signature: HMAC-SHA512 of the raw body with the webhook auth hash,
 * sent as the `Bepin-Signature` header.
 */

const BASE = () => process.env.MONNIFY_BASE_URL ?? "https://api.monnify.com";

function basicAuth(): string {
  const secret = process.env.MONNIFY_SECRET_KEY!;
  return "Basic " + Buffer.from(`${secret}:`).toString("base64");
}

export interface InitializeInput {
  amountNgn: number;
  paymentReference: string; // our order_number
  customerName: string;
  customerEmail: string;
  description: string;
  redirectTo?: string;
}

export interface InitializeResult {
  checkoutUrl: string;
  paymentIntentCode: string;
  transactionCharge: number;
}

export async function initializePayment(
  input: InitializeInput,
): Promise<InitializeResult> {
  const body = {
    amount: input.amountNgn,
    contractCode: process.env.MONNIFY_CONTRACT_CODE!,
    paymentReference: input.paymentReference,
    description: input.description,
    redirectUrl:
      input.redirectTo ??
      `${process.env.NEXT_PUBLIC_SITE_URL}/track?new=${input.paymentReference}`,
    customer: {
      customerName: input.customerName,
      customerEmail: input.customerEmail,
    },
  };

  const res = await fetch(`${BASE()}/api/v1/merchant/payment-intent`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.requestSuccessful) {
    throw new Error(`Monnify init failed: ${json.message ?? "unknown"}`);
  }
  return {
    checkoutUrl: json.responseObject.checkoutUrl,
    paymentIntentCode: json.responseObject.paymentIntentCode,
    transactionCharge: json.responseObject.transactionCharge ?? 0,
  };
}

/**
 * Verify a Monnify webhook call.
 * Monnify signs the raw request body with HMAC-SHA512 using the merchant's
 * webhook auth hash. Returns true only when the signature matches.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = process.env.MONNIFY_WEBHOOK_AUTH_HASH;
  if (!hash) return false;
  const expected = crypto
    .createHmac("sha512", hash)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface MonnifyWebhookPayload {
  event_type?: string;
  transaction_status?: string;
  payment_reference?: string;
  [k: string]: unknown;
}

/** True if the event indicates a completed, successful payment. */
export function isPaidEvent(p: MonnifyWebhookPayload): boolean {
  const status = String(p.transaction_status ?? "").toUpperCase();
  return (
    p.event_type === "SUCCESS" ||
    status === "PAID" ||
    status === "SUCCESS" ||
    status === "APPROVED"
  );
}
