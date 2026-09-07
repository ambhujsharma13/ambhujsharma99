import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used in Server Components, Server Actions, and Route Handlers — reads
// the session from request cookies. Must be created fresh on every
// request (not cached/reused across requests), since it's tied to that
// request's specific cookie store.
//
// The try/catch around cookie writes is intentional, not defensive
// bloat: Server Components can call setAll during rendering, which
// Next.js correctly rejects (Server Components can't set cookies) — but
// the actual session refresh still happens correctly via middleware, so
// this is safe to swallow here rather than crash the render.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component during render — safe to
            // ignore, since middleware handles session refresh instead.
          }
        },
      },
    }
  );
}
