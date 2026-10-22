"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, type AuthResult } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/** Email + password sign-in for a KW account. */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(login, null);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next} />
      <Input
        required
        type="email"
        name="email"
        label="Email"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Input
        required
        type="password"
        name="password"
        label="Password"
        autoComplete="current-password"
      />

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="muted text-center text-sm">
        New to Kitchen&apos;s Worth?{" "}
        <Link
          href={`/signup${next && next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand-green-dark hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
