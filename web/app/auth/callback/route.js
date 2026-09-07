import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Google (via Supabase) redirects here after a successful sign-in, with
// a one-time "code" in the URL. This exchanges that code for a real
// session (setting the session cookie), then sends the user on to
// wherever they were originally trying to go.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/member";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Something went wrong with the exchange — send back to sign-in
  // rather than silently landing on a page with no real session.
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
