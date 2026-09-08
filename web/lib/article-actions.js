"use server";

import { createClient } from "./supabase/server";

const TITLE_MAX_CHARS = 60;
const BODY_MAX_WORDS = 2000;

// Counts words in the saved HTML by stripping tags first — a rough but
// reasonable approximation, consistent with how the client-side
// TipTap CharacterCount extension counts (whitespace-separated tokens
// in the rendered text, not the raw HTML markup).
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export async function saveArticle({ articleId, title, body, status }) {
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
  const wordCount = countWords(body);
  if (wordCount > BODY_MAX_WORDS) {
    return { error: `Body is ${wordCount} words — the limit is ${BODY_MAX_WORDS}.` };
  }

  const row = {
    user_id: user.id,
    title,
    body,
    status,
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
