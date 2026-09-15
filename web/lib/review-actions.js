"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

// Submit article to channels for review
// max 2 public, 5 private — enforced here server-side
export async function submitArticleToChannels(articleId, channelIds) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Verify article belongs to user and is published
  const { data: article } = await supabase
    .from("articles")
    .select("id, status, user_id")
    .eq("id", articleId)
    .eq("user_id", user.id)
    .single();
  if (!article) return { error: "Article not found." };
  if (article.status !== "published") return { error: "Article must be published before submitting to channels." };

  // Fetch channel visibilities to enforce limits
  const { data: channels } = await supabase
    .from("channels")
    .select("id, visibility")
    .in("id", channelIds);

  const publicOnes = (channels || []).filter(c => c.visibility === "public");
  const privateOnes = (channels || []).filter(c => c.visibility === "private");

  if (publicOnes.length > 2) return { error: "Maximum 2 public channels allowed." };
  if (privateOnes.length > 5) return { error: "Maximum 5 private channels allowed." };

  // Private channels → publish directly (no RA review needed)
  // Public channels → go through RA review queue (status = pending)
  const publicChannelIds = publicOnes.map(c => c.id);
  const privateChannelIds = privateOnes.map(c => c.id);

  // Insert private channel articles directly
  if (privateChannelIds.length > 0) {
    const privateRows = privateChannelIds.map(channel_id => ({
      article_id: articleId,
      channel_id,
    }));
    await supabase
      .from("article_channels")
      .upsert(privateRows, { onConflict: "article_id,channel_id", ignoreDuplicates: true });

    // No submission row for private channels — they auto-publish without RA review.
    // The My Articles page reads from article_channel_submissions to show badges,
    // so we skip this entirely for private channels to keep the RA queue clean.
  }

  // Public channels → queue for RA review
  // Public channels → queue for RA review
  // Use UPDATE where submission exists (preserves submission ID + comments),
  // INSERT for fresh submissions
  if (publicChannelIds.length > 0) {
    for (const channel_id of publicChannelIds) {
      // Check if submission already exists for this article+channel
      const { data: existing } = await supabase
        .from("article_channel_submissions")
        .select("id, status")
        .eq("article_id", articleId)
        .eq("channel_id", channel_id)
        .eq("submitted_by", user.id)
        .maybeSingle();

      if (existing?.id) {
        // Re-submission: UPDATE status back to pending (also update submitted_by
        // to current user in case article was submitted by a different session)
        const { error: updateErr } = await supabase
          .from("article_channel_submissions")
          .update({ status: "pending", reviewer_id: null, reviewed_at: null, submitted_by: user.id })
          .eq("id", existing.id);

        if (updateErr) {
          // Fallback: delete and re-insert (handles cross-session submitted_by mismatch)
          await supabase.from("article_channel_submissions").delete().eq("id", existing.id);
          await supabase.from("article_channel_submissions").insert({
            article_id: articleId, channel_id, submitted_by: user.id, status: "pending",
          });
        }
      } else {
        // Fresh first-time submission
        await supabase
          .from("article_channel_submissions")
          .insert({
            article_id: articleId,
            channel_id,
            submitted_by: user.id,
            status: "pending",
          });
      }
    }
  }
  revalidatePath("/member/articles");
  return {
    success: true,
    submitted: channelIds.length,
    privatePublished: privateChannelIds.length,
    publicQueued: publicChannelIds.length,
  };
}

// RA/SA: update submission status
export async function reviewSubmission(submissionId, status, articleId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("article_channel_submissions")
    .update({
      status,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return { error: "Could not update review status." };

  // If approved, add to article_channels AND publish the article
  if (status === "approved") {
    // Publish the article itself
    await supabase
      .from("articles")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", articleId)
      .neq("status", "published"); // only if not already published

    // Insert into article_channels so it appears in the channel feed
    const { data: submission } = await supabase
      .from("article_channel_submissions")
      .select("channel_id")
      .eq("id", submissionId)
      .single();

    if (submission) {
      await supabase.from("article_channels").upsert(
        { article_id: articleId, channel_id: submission.channel_id },
        { onConflict: "article_id,channel_id", ignoreDuplicates: true }
      );
    }
  }

  revalidatePath("/member/settings");
  revalidatePath("/member/admin/review");
  return { success: true };
}

// Add a review comment
export async function addReviewComment({ articleId, submissionId, comment, selectedText, selectionStart, selectionEnd, commentType = "comment" }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("article_review_comments").insert({
    article_id: articleId,
    submission_id: submissionId,
    author_id: user.id,
    comment,
    selected_text: selectedText || null,
    selection_start: selectionStart ?? null,
    selection_end: selectionEnd ?? null,
    comment_type: commentType,
  });

  if (error) return { error: "Could not save comment." };
  revalidatePath("/member/admin/review");
  return { success: true };
}

// Resolve a comment
export async function resolveComment(commentId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("article_review_comments")
    .update({ resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", commentId);

  if (error) return { error: "Could not resolve comment." };
  revalidatePath("/member/admin/review");
  return { success: true };
}

// Author recalls their article from review — sets status back to draft,
// removes pending submissions so it no longer appears in the RA queue.
export async function recallArticle(articleId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Only the author can recall
  const { data: article } = await supabase
    .from("articles")
    .select("user_id")
    .eq("id", articleId)
    .single();
  if (!article || article.user_id !== user.id)
    return { error: "Only the original author can recall this article." };

  // Delete all pending submissions (approved/rejected stay for history)
  await supabase
    .from("article_channel_submissions")
    .delete()
    .eq("article_id", articleId)
    .eq("status", "pending");

  // Set article back to draft
  const { error } = await supabase
    .from("articles")
    .update({ status: "draft", published_at: null })
    .eq("id", articleId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not recall article." };

  revalidatePath("/member/articles");
  revalidatePath("/member/drafts");
  revalidatePath("/member/admin/review");
  return { success: true };
}

// Author adds a response to an RA comment — stored as a comment
// with comment_type = 'author_response'
export async function addAuthorResponse(submissionId, articleId, commentId, responseText) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!responseText?.trim()) return { error: "Please write a response." };

  // Verify article belongs to this user
  const { data: article } = await supabase
    .from("articles")
    .select("user_id")
    .eq("id", articleId)
    .single();
  if (!article || article.user_id !== user.id)
    return { error: "Not authorised." };

  const { error } = await supabase.from("article_review_comments").insert({
    article_id: articleId,
    submission_id: submissionId,
    author_id: user.id,
    comment: responseText.trim(),
    comment_type: "author_response",
    // Link back to the comment being replied to via selected_text
    selected_text: commentId ? `reply_to:${commentId}` : null,
  });

  if (error) return { error: "Could not save response." };
  revalidatePath(`/member/publish`);
  return { success: true };
}
