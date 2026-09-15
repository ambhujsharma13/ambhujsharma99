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

  // Get current rows (RLS disabled — regular client works fine)
  const { data: current, error: fetchErr } = await supabase
    .from("homepage_articles").select("article_id");
  if (fetchErr) return NextResponse.json({ error: "Fetch: " + fetchErr.message }, { status: 500 });

  const currentIds = new Set((current || []).map(r => r.article_id));
  const nextIds = new Set(selectedIds);

  // Remove deselected
  for (const id of currentIds) {
    if (!nextIds.has(id)) {
      const { error } = await supabase.from("homepage_articles").delete().eq("article_id", id);
      if (error) return NextResponse.json({ error: "Remove: " + error.message }, { status: 500 });
    }
  }

  // Add newly selected
  for (const id of nextIds) {
    if (!currentIds.has(id)) {
      const { error } = await supabase.from("homepage_articles")
        .insert({ article_id: id, added_by: user.id });
      if (error) return NextResponse.json({ error: "Insert: " + error.message }, { status: 500 });
    }
  }

  revalidatePath("/");
  revalidatePath("/member/admin/review");
  return NextResponse.json({ ok: true });
}
