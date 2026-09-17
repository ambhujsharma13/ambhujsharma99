import Link from "next/link";

export const metadata = {
  title: "SMS Opt-In Flow — InfinityVolume",
  description: "Demonstrates how InfinityVolume collects mobile phone numbers for identity verification during account creation.",
};

export default function SMSOptInDemoPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">InfinityVolume</Link>
        <span className="mx-1.5">/</span>
        <span className="text-paper/60">SMS Opt-In Flow</span>
      </nav>

      <div className="mb-5 flex items-center gap-2 bg-brass-400/10 border border-brass-400/30 rounded-lg px-4 py-2.5">
        <span className="text-brass-400 text-xs font-body font-semibold uppercase tracking-widest">📋 Demo page</span>
        <span className="text-paper/50 text-xs font-body">— This is a read-only visual demonstration of the opt-in flow for regulatory review. The actual sign-up form is live at infinityvolume.com/sign-up</span>
      </div>

      <h1 className="font-display text-2xl text-paper mb-2">SMS Opt-In Flow</h1>
      <p className="text-paper/50 text-sm font-body mb-8 leading-relaxed">
        This page demonstrates how InfinityVolume (operated by Infinity Group LLC) collects
        mobile phone numbers from users for identity verification. This is the complete opt-in
        journey a new member experiences during account creation.
      </p>

      {/* Step 1 */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-brass-400/20 border border-brass-400/40 text-brass-400 text-xs font-body flex items-center justify-center shrink-0">1</span>
          <h2 className="font-display text-lg text-paper">Account Creation</h2>
        </div>
        <p className="text-paper/50 text-sm font-body mb-4 ml-10">
          The user visits <strong className="text-paper/70">infinityvolume.com/sign-up</strong> and
          creates an account with their email address and password. At the bottom of the form,
          they see a notice referencing the Terms of Service and Privacy Policy before proceeding.
        </p>

        {/* Sign-up form mockup */}
        <div className="ml-10 border border-ink-700 rounded-xl bg-ink-900 p-6">
          <h3 className="font-display text-base text-paper mb-1 text-center">Create your account</h3>
          <p className="text-paper/40 text-xs font-body text-center mb-5">
            Join InfinityVolume — global market data and research community.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-1">Email address</label>
              <div className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-paper/30 text-sm font-body">you@example.com</div>
            </div>
            <div>
              <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-1">Password (min. 8 characters)</label>
              <div className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-paper/30 text-sm font-body">••••••••</div>
            </div>
            <div>
              <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-1">Confirm password</label>
              <div className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-paper/30 text-sm font-body">••••••••</div>
            </div>
            <div className="bg-brass-400/80 text-ink-950 text-sm font-body font-semibold py-3 rounded-lg text-center">
              Create account
            </div>
          </div>
          <p className="text-paper/30 text-[11px] font-body text-center mt-4 leading-relaxed">
            By creating an account, you agree to InfinityVolume&apos;s{" "}
            <span className="text-brass-400/70">Terms of Service</span> and{" "}
            <span className="text-brass-400/70">Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center mb-8 ml-10">
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-6 bg-ink-700" />
          <div className="text-paper/30 text-xs font-body">After account creation</div>
          <div className="w-0.5 h-6 bg-ink-700" />
          <span className="text-paper/40 text-base">↓</span>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-brass-400/20 border border-brass-400/40 text-brass-400 text-xs font-body flex items-center justify-center shrink-0">2</span>
          <h2 className="font-display text-lg text-paper">Phone Number Verification</h2>
        </div>
        <p className="text-paper/50 text-sm font-body mb-4 ml-10">
          After creating their account, the user is automatically redirected to the phone
          verification screen before they can access any member content. This page explains
          why the phone number is required and obtains explicit consent.
        </p>

        {/* Verify phone mockup */}
        <div className="ml-10 border border-ink-700 rounded-xl bg-ink-900 p-6">
          <h3 className="font-display text-xl text-paper mb-4 text-center">Verify your identity</h3>

          {/* The consent message — exact text from production */}
          <div className="border-l-2 border-brass-400/40 pl-3 mb-5">
            <p className="text-paper/60 text-sm font-body leading-relaxed">
              InfinityVolume is a members-only research community built on the quality of its
              members — not their quantity. Every insight, article, and discussion here comes
              from a verified human investor, not a bot, algorithm, or fake profile. We ask for
              your mobile number once, at sign-up, to ensure every account on this platform is
              operated by a real person.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">Mobile number</label>
            <div className="flex gap-2">
              <div className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-paper/50 text-sm font-body w-24 shrink-0">🇺🇸 +1</div>
              <div className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-paper/30 text-sm font-body">Phone number</div>
            </div>
          </div>

          <div className="bg-brass-400/80 text-ink-950 text-sm font-body font-semibold py-3 rounded-lg text-center mb-3">
            Send verification code
          </div>

          <p className="text-paper/25 text-[11px] font-body text-center leading-relaxed">
            We&apos;ll send a 6-digit code via SMS. Standard messaging rates may apply.
            Your number is never shared or used for marketing.
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center mb-8 ml-10">
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-6 bg-ink-700" />
          <div className="text-paper/30 text-xs font-body">After entering phone number</div>
          <div className="w-0.5 h-6 bg-ink-700" />
          <span className="text-paper/40 text-base">↓</span>
        </div>
      </div>

      {/* Step 3 */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-brass-400/20 border border-brass-400/40 text-brass-400 text-xs font-body flex items-center justify-center shrink-0">3</span>
          <h2 className="font-display text-lg text-paper">OTP Code Entry</h2>
        </div>
        <p className="text-paper/50 text-sm font-body mb-4 ml-10">
          InfinityVolume sends a one-time 6-digit verification code via SMS to the user&apos;s
          mobile number. The user enters the code to confirm ownership of the number. The code
          expires in 10 minutes.
        </p>

        {/* OTP entry mockup */}
        <div className="ml-10 border border-ink-700 rounded-xl bg-ink-900 p-6">
          <h3 className="font-display text-xl text-paper mb-2 text-center">Enter your code</h3>
          <p className="text-paper/50 text-sm font-body text-center mb-5">
            We sent a 6-digit code to <span className="text-paper/70">+1 (555) 000-0000</span>. It expires in 10 minutes.
          </p>
          <div className="mb-4">
            <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">Verification code</label>
            <div className="bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-2xl font-mono text-paper/30 text-center tracking-[0.5em]">
              ——————
            </div>
          </div>
          <div className="bg-brass-400/80 text-ink-950 text-sm font-body font-semibold py-3 rounded-lg text-center mb-3">
            Verify
          </div>
          <div className="flex justify-between">
            <span className="text-paper/30 text-xs font-body">← Change number</span>
            <span className="text-paper/30 text-xs font-body">Resend in 60s</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center mb-8 ml-10">
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-6 bg-ink-700" />
          <div className="text-paper/30 text-xs font-body">After successful verification</div>
          <div className="w-0.5 h-6 bg-ink-700" />
          <span className="text-paper/40 text-base">↓</span>
        </div>
      </div>

      {/* Step 4 — success */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full bg-gain/20 border border-gain/40 text-gain text-xs font-body flex items-center justify-center shrink-0">✓</span>
          <h2 className="font-display text-lg text-paper">Access Granted</h2>
        </div>
        <p className="text-paper/50 text-sm font-body ml-10">
          Once the code is verified, the user&apos;s phone number is stored (never shared with
          third parties for marketing purposes) and they are redirected to the member dashboard.
          No further SMS messages are sent unless the user initiates another verification event.
        </p>
      </div>

      {/* SMS Terms summary box */}
      <div className="border border-brass-400/20 rounded-xl bg-brass-400/5 p-5 mb-8">
        <h3 className="font-display text-base text-brass-400 mb-3">SMS Program Summary</h3>
        <div className="space-y-2 text-sm font-body text-paper/60 leading-relaxed">
          <p><strong className="text-paper/70">Program name:</strong> InfinityVolume Identity Verification</p>
          <p><strong className="text-paper/70">Message type:</strong> One-time passcode (OTP) — transactional only, not marketing</p>
          <p><strong className="text-paper/70">Message frequency:</strong> One message per verification event</p>
          <p><strong className="text-paper/70">Message and data rates may apply.</strong></p>
          <p><strong className="text-paper/70">Opt-out:</strong> Contact admin@infinityvolume.com</p>
          <p><strong className="text-paper/70">Help:</strong> admin@infinityvolume.com</p>
          <p><strong className="text-paper/70">Data:</strong> We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.</p>
        </div>
      </div>

      <div className="text-paper/30 text-xs font-body text-center space-y-1">
        <p>
          <Link href="/privacy" className="hover:text-brass-400">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-brass-400">Terms of Service</Link>
        </p>
        <p>InfinityVolume is operated by Infinity Group LLC · admin@infinityvolume.com</p>
      </div>
    </main>
  );
}
