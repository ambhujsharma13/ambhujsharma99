"use server";

import { createClient } from "./supabase/server";

const TITLE_MAX_CHARS = 100;

// Word count is informational only now — no upper limit enforced, per
// explicit request. Kept as a utility (e.g., for a future reading-time
// estimate) even though it's no longer used for validation here.
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export async function saveArticle({
  articleId,
  title,
  body,
  status,
  disclosesPosition = false,
  featuredImageUrl = null,
  tags = [],
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save an article." };
  }
  if (!title || title.length > TITLE_MAX_CHARS) {
    return { error: `Title must be between 1 and ${TITLE_MAX_CHARS} characters.` };
  }

  const row = {
    user_id: user.id,
    title,
    body,
    status,
    discloses_position: disclosesPosition,
    featured_image_url: featuredImageUrl,
    tags,
    updated_at: new Date().toISOString(),
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  if (articleId) {
    // Updating an existing article — RLS on the articles table already
    // enforces that only the author or a listed collaborator can do
    // this, so no extra ownership check is needed here.
    const { error } = await supabase.from("articles").update(row).eq("id", articleId);
    if (error) return { error: "Could not save changes — please try again." };
    return { articleId };
  }

  const { data, error } = await supabase.from("articles").insert(row).select("id").single();
  if (error) return { error: "Could not save the article — please try again." };
  return { articleId: data.id };
}

export async function deleteArticle(articleId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete an article." };
  }

  // RLS's existing UPDATE policy allows the author or a collaborator to
  // edit an article, but DELETE was never explicitly granted to
  // collaborators in the original schema — only the author can delete,
  // matching the same "only the original author controls the article's
  // lifecycle" principle already used for managing collaborators.
  const { error } = await supabase.from("articles").delete().eq("id", articleId).eq("user_id", user.id);
  if (error) return { error: "Could not delete — please try again." };
  return { success: true };
}

