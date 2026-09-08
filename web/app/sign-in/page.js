"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const error = searchParams.get("error");

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    // redirectTo here tells Supabase/Google where to send the browser
    // back to (our own callback route), which then reads the ORIGINAL
    // intended destination from the query param and forwards there.
    const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (signInError) {
      console.error("Google sign-in failed:", signInError.message);
      setLoading(false);
    }
    // On success, the browser navigates away to Google — no further
    // code runs here.
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
        <h1 className="font-display text-xl text-paper mb-2">Sign in to InfinityVolume</h1>
        <p className="text-paper/50 font-body text-sm mb-6">
          Access your watchlist, discussions, and publishing tools.
        </p>

        {error && (
          <p className="text-loss text-xs font-body mb-4">
            Something went wrong signing in — please try again.
          </p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-paper text-ink-950 font-body font-medium rounded-md py-2.5 hover:bg-paper/90 transition-colors disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-paper/30 text-[11px] font-body mt-6">
          By continuing, you agree to InfinityVolume&apos;s{" "}
          <a href="/terms" className="underline hover:text-paper/50">Terms</a> and{" "}
          <a href="/privacy" className="underline hover:text-paper/50">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
