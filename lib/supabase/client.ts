import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the anon key; RLS enforces access.
 * Never call this from a server component (use `lib/supabase/server.ts`).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
