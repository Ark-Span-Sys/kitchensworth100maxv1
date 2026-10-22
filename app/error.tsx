"use client";

import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="heading-lg mt-4">Something went wrong</h1>
      <p className="muted mt-2">
        We hit a snag loading this page. Try again. If it keeps happening, ping us on WhatsApp.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
