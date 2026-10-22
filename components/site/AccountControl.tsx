"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/(auth)/actions";

/**
 * Account links rendered inside the navigation (desktop bar + mobile menu).
 * Reflects Supabase auth state: a "Log in" link when signed out, and account /
 * refer / sign-out links when signed in. There is no standalone header icon.
 */
export function AccountControl({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const linkCls = mobile
    ? "py-2 text-left text-sm font-medium text-brand-black/70"
    : "text-sm font-medium text-brand-black/70 transition hover:text-brand-black";

  if (!user) {
    return (
      <Link href="/login" className={linkCls} onClick={onNavigate}>
        Log in
      </Link>
    );
  }

  return (
    <>
      <Link href="/account" className={linkCls} onClick={onNavigate}>
        My account
      </Link>
      <Link href="/refer" className={linkCls} onClick={onNavigate}>
        Refer &amp; earn
      </Link>
      <form action={logout} className={mobile ? "w-full" : "inline"}>
        <button
          type="submit"
          className={
            linkCls +
            " inline-flex items-center gap-1.5" +
            (mobile ? " w-full" : "")
          }
        >
          <LogOut size={14} /> Sign out
        </button>
      </form>
    </>
  );
}
