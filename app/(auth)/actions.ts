"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  error?: string;
  ok?: boolean;
  /** Set when signup succeeded but email confirmation is required. */
  needsConfirmation?: boolean;
}

function formStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Create a KW account. Reads an optional referral code from the `kw_ref`
 * cookie (set by /refer?code=… or shared links) and, once the profile exists,
 * wires up `referred_by` + a pending `referrals` row.
 */
export async function signUp(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formStr(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const fullName = formStr(formData, "full_name");
  const ref = formStr(formData, "ref");

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });
  if (error) return { error: error.message };

  // Email confirmation disabled → session exists immediately, link referral.
  if (data.session && data.user) {
    await captureReferral(supabase, data.user.id, ref);
    redirect("/account");
  }

  // Confirmation required: referral is linked later, on first login, by
  // re-reading the still-present cookie in `login`.
  return { ok: true, needsConfirmation: true };
}

/**
 * Sign in. Also links any pending referral captured from the `kw_ref` cookie
 * (covers the confirmation-required signup path).
 */
export async function login(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formStr(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const next = formStr(formData, "next") || "/account";

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  if (data.user) await captureReferral(supabase, data.user.id);

  redirect(next.startsWith("/") ? next : "/account");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Attach a referral to the newly authenticated profile if:
 *  - a `kw_ref` cookie is present,
 *  - the profile has no referrer yet, and
 *  - the code maps to an existing (different) profile.
 */
async function captureReferral(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  explicitCode?: string,
): Promise<void> {
  const store = await cookies();
  const code = (explicitCode || store.get("kw_ref")?.value || "").trim();
  if (!code) return;

  // Don't overwrite an existing relationship.
  const { data: me } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .single();
  if (me?.referred_by) return;

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .single();
  if (!referrer || referrer.id === userId) return;

  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", userId);
  await supabase
    .from("referrals")
    .insert({ referrer_id: referrer.id, referee_id: userId, status: "pending" });

  // One-time use.
  store.delete("kw_ref");
}
