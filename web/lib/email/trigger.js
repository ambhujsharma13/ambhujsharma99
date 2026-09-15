/**
 * Client-side helper to fire email notifications via /api/email-trigger.
 * Fire-and-forget — never blocks the primary action, never throws.
 */
export async function triggerEmail(type, payload) {
  try {
    await fetch("/api/email-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
  } catch (err) {
    console.warn("[email] trigger failed silently:", type, err.message);
  }
}
