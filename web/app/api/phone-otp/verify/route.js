import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import crypto from "crypto";

const MAX_ATTEMPTS = 5;

function normalizePhone(raw) {
  return raw.replace(/[^\d+]/g, "");
}

function hashOTP(otp) {
  const secret = process.env.OTP_SECRET || "infinityvolume-otp-secret";
  return crypto.createHash("sha256").update(otp + secret).digest("hex");
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, otp } = await request.json();
  if (!phone || !otp) return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });

  const normalized = normalizePhone(phone);
  const otpHash = hashOTP(otp.trim());

  // Fetch OTP record
  const { data: record } = await supabase
    .from("phone_otp")
    .select("id, otp_hash, expires_at, attempts")
    .eq("phone", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 404 });
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    await supabase.from("phone_otp").delete().eq("id", record.id);
    return NextResponse.json({ error: "Verification code has expired. Please request a new one.", code: "EXPIRED" }, { status: 410 });
  }

  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await supabase.from("phone_otp").delete().eq("id", record.id);
    return NextResponse.json({ error: "Too many incorrect attempts. Please request a new code.", code: "MAX_ATTEMPTS" }, { status: 429 });
  }

  // Increment attempts
  await supabase.from("phone_otp").update({ attempts: record.attempts + 1 }).eq("id", record.id);

  // Check OTP
  if (record.otp_hash !== otpHash) {
    const remaining = MAX_ATTEMPTS - record.attempts - 1;
    return NextResponse.json({
      error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      code: "WRONG_OTP",
      remaining
    }, { status: 400 });
  }

  // OTP correct — mark phone as verified on profile
  await supabase.from("profiles").update({ phone: normalized, phone_verified: true }).eq("id", user.id);
  await supabase.from("phone_otp").delete().eq("id", record.id);

  return NextResponse.json({ ok: true, verified: true });
}
