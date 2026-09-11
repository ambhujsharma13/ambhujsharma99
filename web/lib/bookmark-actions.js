"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleBookmark({ contentType, articleId, postId }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to bookmark." };

  // Check if already bookmarked
  const matchCol = contentType === "article" ? "article_id" : "post_id";
  const matchVal = contentType === "article" ? articleId : postId;

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq(matchCol, matchVal)
    .single();

  if (existing) {
    // Already bookmarked — remove it
    const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
    if (error) return { error: "Could not remove bookmark — please try again." };
    revalidatePath("/member/bookmarks");
    return { bookmarked: false };
  }

  // Not yet bookmarked — add it
  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    content_type: contentType,
    article_id: articleId ?? null,
    post_id: postId ?? null,
  });
  if (error) return { error: "Could not save bookmark — please try again." };
  revalidatePath("/member/bookmarks");
  return { bookmarked: true };
}

export async function removeBookmark(bookmarkId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id); // RLS-scoped in SQL too, but explicit here
  if (error) return { error: "Could not remove bookmark — please try again." };
  revalidatePath("/member/bookmarks");
  return { success: true };
}
