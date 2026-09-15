import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("admin_role").eq("id", user.id).single();

  if (profile?.admin_role !== "super_admin")
    return NextResponse.json({ error: `SA only. Role: ${profile?.admin_role}` }, { status: 403 });

  const { selectedIds } = await request.json();
  if (!Array.isArray(selectedIds) || selectedIds.length > 10)
    return NextResponse.json({ error: "Invalid selectedIds" }, { status: 400 });

  // Use service role client if key available (bypasses RLS), otherwise fall back to user session
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let adminClient;

  if (serviceKey) {
    // Dynamic import to avoid module-level crash if package isn't installed
    const { createClient: createSC } = await import("@supabase/supabase-js");
    adminClient = createSC(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
  } else {
    // Fallback: use user session client (works only while RLS is disabled or policy allows SA)
    adminClient = supabase;
  }

  const { data: current, error: fetchErr } = await adminClient
    .from("homepage_articles").select("article_id");
  if (fetchErr) return NextResponse.json({ error: "Fetch: " + fetchErr.message }, { status: 500 });

  const currentIds = new Set((current || []).map(r => r.article_id));
  const nextIds = new Set(selectedIds);

  for (const id of currentIds) {
    if (!nextIds.has(id)) {
      const { error } = await adminClient.from("homepage_articles").delete().eq("article_id", id);
      if (error) return NextResponse.json({ error: "Remove: " + error.message }, { status: 500 });
    }
  }

  for (const id of nextIds) {
    if (!currentIds.has(id)) {
      const { error } = await adminClient.from("homepage_articles")
        .insert({ article_id: id, added_by: user.id });
      if (error) return NextResponse.json({ error: "Insert: " + error.message }, { status: 500 });
    }
  }

  revalidatePath("/");
  revalidatePath("/member/admin/review");
  return NextResponse.json({ ok: true, usedServiceRole: !!serviceKey });
}
