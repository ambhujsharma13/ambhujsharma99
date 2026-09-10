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
  disclosedHoldings = "",
  ownCritique = "",
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
    title,
    body,
    status,
    disclosed_holdings: disclosedHoldings,
    own_critique: ownCritique,
    featured_image_url: featuredImageUrl,
    tags,
    updated_at: new Date().toISOString(),
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  if (articleId) {
    // Updating an existing article — RLS on the articles table already
    // enforces that only the author or a listed collaborator can do
    // this, so no extra ownership check is needed here. Deliberately
    // does NOT include user_id in this update — confirmed as a real
    // bug found while building the collaborator UI: user_id used to be
    // part of the shared `row` object used for both insert and update,
    // meaning a collaborator saving/autosaving an existing article
    // would silently overwrite the original author's user_id with
    // their own, transferring ownership by accident. Ownership is only
    // ever set at creation time, never touched on an update.
    const { error } = await supabase.from("articles").update(row).eq("id", articleId);
    if (error) return { error: "Could not save changes — please try again." };
    return { articleId };
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...row, user_id: user.id })
    .select("id")
    .single();
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

export async function addCollaborator(articleId, identifier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!identifier || !identifier.trim()) return { error: "Please enter a username or email." };

  const clean = identifier.trim();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .or(`email.eq.${clean},display_name.ilike.${clean}`)
    .limit(1)
    .single();

  if (!targetProfile) {
    return { error: `No member found matching "${identifier}" — check the exact username or email.` };
  }

  // Checked explicitly rather than relying on a unique-constraint
  // error, since this insert now targets pending_requests, not
  // article_collaborators directly.
  const { data: existingCollaborator } = await supabase
    .from("article_collaborators")
    .select("user_id")
    .eq("article_id", articleId)
    .eq("user_id", targetProfile.id)
    .single();
  if (existingCollaborator) {
    return { error: `${targetProfile.display_name || identifier} is already a collaborator on this article.` };
  }

  // Creates a pending invite rather than adding the collaborator
  // directly — per explicit request, the invited person now needs to
  // accept before they actually get edit access, rather than being
  // silently granted it without their consent.
  const { error } = await supabase.from("pending_requests").insert({
    request_type: "collaborator_invite",
    article_id: articleId,
    invited_user_id: targetProfile.id,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: `${targetProfile.display_name || identifier} already has a pending invite to collaborate on this article.`,
      };
    }
    return { error: "Could not send the invite — please try again." };
  }

  return { success: true, addedName: targetProfile.display_name || targetProfile.email };
}

export async function removeCollaborator(articleId, userId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("article_collaborators")
    .delete()
    .eq("article_id", articleId)
    .eq("user_id", userId);

  if (error) return { error: "Could not remove that collaborator — please try again." };
  return { success: true };
}

