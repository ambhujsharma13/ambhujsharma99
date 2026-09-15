// ONE-TIME SETUP ROUTE — delete after running once
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get ALL current profiles
  const { data: profiles, error: fetchErr } = await admin
    .from("profiles")
    .select("id, display_name");

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // Mark every existing profile as legacy — they skip the phone wall
  const results = [];
  for (const p of profiles || []) {
    const { error } = await admin
      .from("profiles")
      .update({ requires_phone_verify: false })
      .eq("id", p.id);
    results.push({ 
      name: p.display_name, 
      id: p.id.slice(0, 8),
      ok: !error, 
      error: error?.message 
    });
  }

  return NextResponse.json({ ok: true, total: results.length, results });
}
