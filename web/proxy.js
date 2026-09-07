import { updateSession } from "./lib/supabase/middleware";

// Renamed from "middleware" to "proxy" per Next.js 16's file-convention
// rename (confirmed directly from Next.js's own docs after a real "The
// middleware file convention is deprecated" warning surfaced during
// testing) — this file must be named proxy.js at the project root, and
// the exported function must be named "proxy", not "middleware". The
// config/matcher export is unaffected by the rename.
export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Supabase's own documented matcher pattern, used as-is rather than
    // a custom modification — an earlier attempt to also exclude image
    // file extensions here introduced an unanchored regex that could
    // match starting from a LATER position within a path string,
    // confirmed via testing to behave inconsistently. Not worth the
    // risk for what was only a minor performance optimization.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
