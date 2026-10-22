import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Create account",
  description: "Create a Kitchen's Worth account to leave reviews and earn refer-and-earn credits.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; next?: string }>;
}) {
  const { ref, next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <header className="text-center">
        <h1 className="heading-lg">Create your account</h1>
        <p className="muted mt-2 text-sm">
          {ref
            ? "You're signing up with a referral link — you'll both earn credit once you place your first order."
            : "An account lets you review dishes and earn credit by referring friends. Ordering as a guest always stays available."}
        </p>
      </header>
      <SignupForm refCode={ref && /^[A-Za-z0-9]{4,16}$/.test(ref) ? ref : ""} />
    </div>
  );
}
