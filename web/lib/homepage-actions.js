"use server";
import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function saveHomepageArticles(selectedIds) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify SA
  const { data: profile } = await supabase
    .from("profiles")
    .select("admin_role")
    .eq("id", user.id)
    .single();
  if (profile?.admin_role !== "super_admin") throw new Error("Unauthorized");

  // Get current
  const { data: current } = await supabase
    .from("homepage_articles")
    .select("article_id");
  const currentIds = new Set((current || []).map(r => r.article_id));
  const nextIds = new Set(selectedIds);

  // Remove deselected
  for (const id of currentIds) {
    if (!nextIds.has(id)) {
      await supabase.from("homepage_articles").delete().eq("article_id", id);
    }
  }
  // Add new
  for (const id of nextIds) {
    if (!currentIds.has(id)) {
      await supabase.from("homepage_articles").insert({ article_id: id, added_by: user.id });
    }
  }

  // Revalidate homepage so DiscussionBox re-fetches immediately
  revalidatePath("/");
  revalidatePath("/member/admin/review");
}
