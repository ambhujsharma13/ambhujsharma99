import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Handles two Supabase auth callback flows:
//
// 1. OAuth (Google) sign-in — Supabase redirects here with a ?code=
//    parameter. We exchange it for a session and forward to redirectTo.
//
// 2. Email confirmation (sign-up) — same ?code= flow, same handler.
//    Supabase sends a confirmation email with a link to this route.
//
// 3. Password reset — Supabase sends a reset email with a link that
//    includes a hash fragment (#access_token=...). Hash fragments are
//    never sent to the server, so the reset-password PAGE handles the
//    token exchange client-side via onAuthStateChange. This route is
//    NOT involved in password reset — it's handled entirely in
//    /reset-password/page.js.

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful sign-in or email confirmation — forward to destination
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
