"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signUp, type AuthResult } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/** Create a KW account. Optional `refCode` links a referral at signup. */
export function SignupForm({ refCode }: { refCode: string }) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(signUp, null);

  if (state?.ok && state.needsConfirmation) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <p className="font-semibold text-brand-green-dark">Check your email</p>
        <p className="muted text-sm">
          We sent a confirmation link to activate your account. Once confirmed, sign in to see your
          credits and reviews.
        </p>
        <Link href="/login" className="btn-green w-full">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {refCode && <input type="hidden" name="ref" value={refCode} />}
      <Input type="text" name="full_name" label="Full name" autoComplete="name" placeholder="Ada Okafor" />
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
        autoComplete="new-password"
        hint="At least 6 characters."
      />

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="muted text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-green-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
