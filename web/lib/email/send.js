import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "InfinityVolume <noreply@infinityvolume.com>";

/**
 * Central send wrapper. Returns { ok: true } or { ok: false, error }.
 * Never throws — email failures should not break the primary workflow.
 */
export async function sendEmail({ to, subject, react }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, react });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] Unexpected error:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch a user's email from Supabase auth.users using the service role.
 * Returns null if not found or no service role key.
 */
export async function getUserEmail(supabaseAdmin, userId) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    return error ? null : data?.user?.email ?? null;
  } catch {
    return null;
  }
}
