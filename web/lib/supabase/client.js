import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ("use client" files) — anywhere auth state
// or data needs to be read/written directly from the browser. Reads the
// same cookie-based session that the server client and middleware also
// read, via @supabase/ssr's shared cookie handling.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
