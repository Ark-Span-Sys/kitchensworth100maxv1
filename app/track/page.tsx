import type { Metadata } from "next";
import { TrackClient } from "./track-client";

export const metadata: Metadata = {
  title: "Track my order",
  description:
    "Track your Kitchen's Worth order using the KW-XXXXXX code from your WhatsApp confirmation, or look up all recent orders by phone number.",
};

/**
 * /track — order lookup by code or phone. Uses the `track_orders` SECURITY
 * DEFINER RPC (see 003_rls.sql) so customers can see their own orders without
 * logging in. If the URL has `?new=KW-XXXX` (post-Monnify redirect), the page
 * auto-fires the WhatsApp handoff.
 */
export default function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; phone?: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="heading-xl">Track my order</h1>
        <p className="muted mt-3">
          Enter the KW-code we sent you on WhatsApp, or your phone number to see all recent orders.
        </p>
      </header>
      <TrackServerWrapper searchParamsPromise={searchParams} />
    </div>
  );
}

// Server wrapper so we can await searchParams before handing to the client.
async function TrackServerWrapper({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ new?: string; phone?: string }>;
}) {
  const sp = await searchParamsPromise;
  return <TrackClient initialNew={sp.new} initialPhone={sp.phone} />;
}
