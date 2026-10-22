import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

/**
 * /admin/login — Supabase magic-link + email/password.
 * Only users with `profiles.is_admin = true` can proceed past /admin/layout.
 */
export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/admin");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20">
      <header className="text-center">
        <div className="mb-2 font-display text-3xl font-black">Kitchen's Worth</div>
        <h1 className="heading-md">Admin sign-in</h1>
        <p className="muted mt-2 text-sm">
          Magic link is fastest, no password to remember. Public sign-up is disabled.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
