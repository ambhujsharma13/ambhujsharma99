"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleArticlePin(articleId, currentlyPinned) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("articles")
    .update({ is_pinned: !currentlyPinned })
    .eq("id", articleId)
    .eq("user_id", user.id); // only own articles
  if (error) return { error: "Could not update pin." };
  revalidatePath("/member/articles");
  return { pinned: !currentlyPinned };
}

export async function toggleWatchlistPin(watchlistId, currentlyPinned) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("watchlists")
    .update({ is_pinned: !currentlyPinned })
    .eq("id", watchlistId)
    .eq("user_id", user.id);
  if (error) return { error: "Could not update pin." };
  revalidatePath("/member/reports");
  return { pinned: !currentlyPinned };
}

export async function toggleDirectMessagePin(messageId, currentlyPinned) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Both sender and recipient can pin — confirmed by checking either column
  const { error } = await supabase
    .from("direct_messages")
    .update({ is_pinned: !currentlyPinned })
    .eq("id", messageId)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
  if (error) return { error: "Could not update pin." };
  return { pinned: !currentlyPinned };
}
