"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { updatePassword } from "../../lib/auth-actions";

const PASSWORD_MIN_LENGTH = 8;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    // Supabase sends the reset token as a hash fragment (#access_token=...).
    // The client SDK listens for the onAuthStateChange event and automatically
    // exchanges the hash fragment for a real session — we just need to wait
    // for that exchange to complete before showing the form.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function validate() {
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
      const result = await updatePassword(password);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
        setTimeout(() => router.push("/"), 3000);
      }
    });
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="w-full max-w-sm border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="font-display text-xl text-paper mb-2">Password updated</h1>
          <p className="text-paper/50 font-body text-sm">
            Your password has been changed. Redirecting you to the homepage…
          </p>
        </div>
      </main>
    );
  }

  if (!sessionReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="w-full max-w-sm border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <p className="text-paper/40 font-body text-sm">Verifying your reset link…</p>
          <p className="text-paper/20 text-xs font-body mt-3">
            If nothing happens,{" "}
            <Link href="/forgot-password" className="text-brass-400 hover:underline">
              request a new link
            </Link>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-paper mb-1">Choose a new password</h1>
          <p className="text-paper/40 font-body text-sm">
            Pick something strong — at least {PASSWORD_MIN_LENGTH} characters.
          </p>
        </div>

        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8">
          {error && (
            <p className="text-loss text-xs font-body mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-paper/50 text-xs font-body mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/20"
              />
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
              <label className="block text-paper/50 text-xs font-body mb-1.5">Confirm new password</label>
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
              {isPending ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
