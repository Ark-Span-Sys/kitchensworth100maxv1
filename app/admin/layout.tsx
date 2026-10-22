import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata = {
  title: { absolute: "Admin · Kitchen's Worth" },
  robots: { index: false, follow: false },
};

/**
 * /admin/* layout. Guards on session + `profiles.is_admin`, wraps everything
 * in a compact sidebar shell. Non-admins get bounced to /admin/login.
 */
const SIDEBAR = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/menu", label: "Menu items", icon: "🍽️" },
  { href: "/admin/categories", label: "Categories", icon: "🏷️" },
  { href: "/admin/party-packs", label: "Party packs", icon: "🎉" },
  { href: "/admin/bulk-tiers", label: "Bulk tiers", icon: "📦" },
  { href: "/admin/catering", label: "Catering", icon: "🍢" },
  { href: "/admin/cities", label: "Cities", icon: "🌍" },
  { href: "/admin/zones", label: "Delivery zones", icon: "🛵" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page lives under this layout, so it must not be bounced back to
  // itself (infinite redirect). Skip the guard + sidebar shell for auth routes.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin,full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-4 space-y-4">
          <Link href="/admin" className="block font-display text-xl font-black">
            KW · Admin
          </Link>
          <nav>
            <ul className="space-y-1">
              {SIDEBAR.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-brand-black/5"
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="muted border-t border-brand-black/10 pt-3 text-xs">
            <div>Signed in as</div>
            <div className="truncate font-medium text-brand-black">{profile.full_name ?? user.email}</div>
            <form action={signOut}>
              <button className="mt-2 text-brand-green-dark hover:underline">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
