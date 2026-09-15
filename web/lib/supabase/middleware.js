import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Paths that don't require a signed-in user. Everything else under the
// member area (watchlist, discussions, publish, account) redirects to
// sign-in if there's no session — this is the "middleware-level route
// protection" pattern, catching unauthenticated requests before they
// ever reach a page component, rather than checking auth inside every
// individual page.
const PUBLIC_PATHS = ["/", "/sign-in", "/auth", "/terms", "/privacy", "/about", "/verify-phone"];
const TFA_LAUNCH = new Date("2026-09-15T00:00:00Z");

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Everything else on the existing public site (markets, treasury, etf,
  // etc. landing pages) stays public — only a specific member-area
  // prefix requires auth, added once that area exists.
  if (!pathname.startsWith("/member")) return true;
  return false;
}

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // IMPORTANT (per Supabase's own guidance): calling getUser() here,
  // not getSession(), is what actually revalidates the session against
  // the auth server on every request — getSession() alone would just
  // trust whatever's in the cookie without re-checking it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2FA phone verification wall — accounts with requires_phone_verify = true
  // must verify their phone before accessing /member/* pages.
  // Legacy accounts (the original 5) have requires_phone_verify = false.
  if (user && request.nextUrl.pathname.startsWith("/member")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified, requires_phone_verify")
      .eq("id", user.id)
      .single();

    // Only enforce if explicitly flagged OR null (new accounts default to true, null = not yet set = treat as new)
    if (profile?.requires_phone_verify !== false && !profile?.phone_verified) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/verify-phone";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
