"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { signInWithEmail } from "../../lib/auth-actions";

export default function SignInPage() {
  const [tab, setTab] = useState("email"); // "email" | "google"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const urlError = searchParams.get("error");

  async function handleGoogleSignIn() {
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (signInError) setError(signInError.message);
    });
  }

  function handleEmailSignIn(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    startTransition(async () => {
      const result = await signInWithEmail(email.trim(), password);
      if (result?.error) {
        // Supabase returns "Invalid login credentials" for wrong password — make it friendlier
        setError(result.error.includes("Invalid") ? "Incorrect email or password." : result.error);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-paper mb-1">Sign in to InfinityVolume</h1>
          <p className="text-paper/40 font-body text-sm">
            Access your watchlist, discussions, and publishing tools.
          </p>
        </div>

        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8">
          {/* Tab selector */}
          <div className="flex rounded-md bg-ink-800 p-0.5 mb-6">
            <button
              onClick={() => { setTab("email"); setError(""); }}
              className={`flex-1 text-sm font-body py-1.5 rounded transition-colors ${
                tab === "email" ? "bg-ink-700 text-paper" : "text-paper/40 hover:text-paper/70"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => { setTab("google"); setError(""); }}
              className={`flex-1 text-sm font-body py-1.5 rounded transition-colors ${
                tab === "google" ? "bg-ink-700 text-paper" : "text-paper/40 hover:text-paper/70"
              }`}
            >
              Google
            </button>
          </div>

          {(urlError || error) && (
            <p className="text-loss text-xs font-body mb-4 text-center">
              {error || "Something went wrong — please try again."}
            </p>
          )}

          {tab === "email" ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-paper/50 text-xs font-body mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/20"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-paper/50 text-xs font-body">Password</label>
                  <Link href="/forgot-password" className="text-brass-400 text-xs font-body hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/20"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-brass-400 text-ink-950 font-body font-medium rounded-md py-2.5 hover:bg-brass-300 transition-colors disabled:opacity-60 text-sm"
              >
                {isPending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 bg-paper text-ink-950 font-body font-medium rounded-md py-2.5 hover:bg-paper/90 transition-colors disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              {isPending ? "Signing in…" : "Continue with Google"}
            </button>
          )}

          <p className="text-center text-paper/30 text-xs font-body mt-6">
            Don&apos;t have an account?{" "}
            <Link href={`/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-brass-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-paper/20 text-[11px] font-body text-center mt-4">
          By continuing, you agree to InfinityVolume&apos;s{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
