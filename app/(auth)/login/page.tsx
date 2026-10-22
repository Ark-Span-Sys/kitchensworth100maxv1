import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Kitchen's Worth account to leave reviews and track referral credits.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <header className="text-center">
        <h1 className="heading-lg">Welcome back</h1>
        <p className="muted mt-2 text-sm">
          Sign in to leave reviews and follow your refer-and-earn credits. You can still order as a
          guest without an account.
        </p>
      </header>
      <LoginForm next={next && next.startsWith("/") ? next : "/account"} />
    </div>
  );
}
