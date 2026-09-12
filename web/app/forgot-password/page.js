"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { sendPasswordReset } from "../../lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    startTransition(async () => {
      const result = await sendPasswordReset(email.trim());
      // Always show success even if email not found — prevents account enumeration.
      if (result?.error && !result.error.includes("not found")) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="w-full max-w-sm border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <div className="text-4xl mb-4">📨</div>
          <h1 className="font-display text-xl text-paper mb-2">Check your email</h1>
          <p className="text-paper/50 font-body text-sm mb-6">
            If an account exists for <span className="text-paper/80">{email}</span>, we&apos;ve sent a
            password reset link. It expires in 1 hour.
          </p>
          <Link href="/sign-in" className="text-brass-400 text-sm font-body hover:underline">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-paper mb-1">Reset your password</h1>
          <p className="text-paper/40 font-body text-sm">
            Enter your email and we&apos;ll send you a reset link.
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brass-400 text-ink-950 font-body font-medium rounded-md py-2.5 hover:bg-brass-300 transition-colors disabled:opacity-60 text-sm"
            >
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-paper/30 text-xs font-body mt-6">
            <Link href="/sign-in" className="text-brass-400 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
