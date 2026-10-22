"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Client form for /admin/login. Supports both magic-link (recommended) and
 * email+password. After a successful sign-in we redirect to /admin.
 */
export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else router.push("/admin");
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/admin` },
    });
    setBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else
      setMsg({
        kind: "ok",
        text: "Magic link sent, check your inbox. It expires in 15 minutes.",
      });
  }

  return (
    <div className="card space-y-6 p-6">
      <form onSubmit={sendMagicLink} className="space-y-3">
        <Input
          required
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@kitchensworth.ng"
          autoComplete="email"
        />
        <Button type="submit" disabled={busy || !email} className="w-full">
          {busy ? "Sending..." : "Send magic link"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-black/10" />
        <span className="muted text-xs uppercase">or use a password</span>
        <div className="h-px flex-1 bg-brand-black/10" />
      </div>

      <form onSubmit={signInWithPassword} className="space-y-3">
        <Input
          required
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" variant="secondary" disabled={busy || !email || !password} className="w-full">
          Sign in with password
        </Button>
      </form>

      {msg && (
        <p
          className={`rounded-xl px-4 py-2 text-sm ${
            msg.kind === "ok" ? "bg-brand-green/20 text-brand-green-dark" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
