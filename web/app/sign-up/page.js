"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUpWithEmail } from "../../lib/auth-actions";

const PASSWORD_MIN_LENGTH = 8;

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  function validate() {
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (password !== confirm) return "Passwords don't match.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    startTransition(async () => {
      const result = await signUpWithEmail(email.trim(), password);
      if (result?.error) {
        setError(result.error.includes("already registered")
          ? "An account with this email already exists. Try signing in instead."
          : result.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="w-full max-w-sm border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="font-display text-xl text-paper mb-2">Check your email</h1>
          <p className="text-paper/50 font-body text-sm mb-6">
            We sent a confirmation link to <span className="text-paper/80">{email}</span>.
            Click it to activate your account and sign in.
          </p>
          <p className="text-paper/30 text-xs font-body">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button onClick={() => setDone(false)} className="text-brass-400 hover:underline">
              try again
            </button>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-paper mb-1">Create your account</h1>
          <p className="text-paper/40 font-body text-sm">
            Join InfinityVolume — global market data and research community.
          </p>
        </div>

        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8">
          {error && (
            <p className="text-loss text-xs font-body mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-paper/50 text-xs font-body mb-1.5">
                Password <span className="text-paper/30">(min. {PASSWORD_MIN_LENGTH} characters)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/20"
              />
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${
                        password.length >= [8, 12, 16, 20][i]
                          ? ["bg-loss", "bg-yellow-500", "bg-gain", "bg-brass-400"][i]
                          : "bg-ink-700"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-paper/50 text-xs font-body mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full bg-ink-800 border rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none placeholder:text-paper/20 ${
                  confirm && confirm !== password ? "border-loss" : "border-ink-700 focus:border-brass-400"
                }`}
              />
              {confirm && confirm !== password && (
                <p className="text-loss text-[11px] font-body mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brass-400 text-ink-950 font-body font-medium rounded-md py-2.5 hover:bg-brass-300 transition-colors disabled:opacity-60 text-sm mt-2"
            >
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-paper/30 text-xs font-body mt-6">
            Already have an account?{" "}
            <Link href={`/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-brass-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-paper/20 text-[11px] font-body text-center mt-4">
          By creating an account, you agree to InfinityVolume&apos;s{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
