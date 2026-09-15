"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Country codes — top markets first
const COUNTRIES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
];

export default function PhoneVerification({ onVerified }) {
  const router = useRouter();
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const fullPhone = countryCode + phoneNumber.replace(/[^\d]/g, "");

  async function handleSendOTP(e) {
    e?.preventDefault();
    if (!phoneNumber.trim() || loading) return;
    setLoading(true);
    setError(null);

    const resp = await fetch("/api/phone-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error);
      if (data.code === "PHONE_LIMIT_REACHED") {
        // Keep on phone step so they can try a different number
      }
    } else if (data.already_verified) {
      onVerified?.();
      router.push("/member");
    } else {
      setStep("otp");
      // 60s resend cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
      }, 1000);
    }
    setLoading(false);
  }

  async function handleVerifyOTP(e) {
    e?.preventDefault();
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    setError(null);

    const resp = await fetch("/api/phone-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone, otp }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setError(data.error);
      if (data.code === "EXPIRED" || data.code === "MAX_ATTEMPTS") {
        setStep("phone");
        setOtp("");
      }
    } else {
      onVerified?.();
      router.push("/member");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-2xl text-brass-400 tracking-wide">InfinityVolume</span>
        </div>

        <div className="border border-ink-700 rounded-2xl bg-ink-900 p-8">
          {step === "phone" ? (
            <>
              <h1 className="font-display text-xl text-paper mb-2">Verify your identity</h1>

              {/* Compelling message */}
              <p className="text-paper/50 text-sm font-body leading-relaxed mb-6 border-l-2 border-brass-400/40 pl-3">
                InfinityVolume is a members-only research community built on the quality of its members — not their quantity. Every insight, article, and discussion here comes from a verified human investor, not a bot, algorithm, or fake profile. We ask for your mobile number once, at sign-up, to ensure every account on this platform is operated by a real person.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">
                    Mobile number
                  </label>
                  <div className="flex gap-2">
                    {/* Country code selector */}
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-3 text-sm font-body text-paper/80 focus:outline-none focus:border-brass-400 shrink-0 w-28"
                    >
                      {COUNTRIES.map((c, i) => (
                        <option key={i} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    {/* Number input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-loss/10 border border-loss/30 rounded-lg px-4 py-3">
                    <p className="text-loss text-xs font-body">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!phoneNumber.trim() || loading}
                  className="w-full bg-brass-400 text-ink-950 font-body font-semibold py-3 rounded-lg hover:bg-brass-300 transition-colors disabled:opacity-40 text-sm"
                >
                  {loading ? "Sending code…" : "Send verification code"}
                </button>
              </form>

              <p className="text-paper/25 text-[10px] font-body text-center mt-4 leading-relaxed">
                We'll send a 6-digit code via SMS. Standard messaging rates may apply. Your number is never shared or used for marketing.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl text-paper mb-2">Enter your code</h1>
              <p className="text-paper/50 text-sm font-body mb-6">
                We sent a 6-digit code to <span className="text-paper/70">{fullPhone}</span>. It expires in 10 minutes.
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-2xl font-mono text-paper text-center tracking-[0.5em] focus:outline-none focus:border-brass-400"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-loss/10 border border-loss/30 rounded-lg px-4 py-3">
                    <p className="text-loss text-xs font-body">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="w-full bg-brass-400 text-ink-950 font-body font-semibold py-3 rounded-lg hover:bg-brass-300 transition-colors disabled:opacity-40 text-sm"
                >
                  {loading ? "Verifying…" : "Verify"}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
                  className="text-paper/30 text-xs font-body hover:text-paper/60 transition-colors"
                >
                  ← Change number
                </button>
                <button
                  onClick={handleSendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className="text-brass-400/60 text-xs font-body hover:text-brass-400 transition-colors disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
