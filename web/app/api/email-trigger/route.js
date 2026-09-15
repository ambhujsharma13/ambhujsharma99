import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email/send";
import { HumanIntelAnsweredEmail, HumanIntelFollowUpEmail, HumanIntelDeniedEmail } from "../../../lib/email/templates/human-intel";
import { ArticleApprovedEmail, ArticleChangesRequestedEmail, ArticleRejectedEmail, PrivateChannelInviteEmail } from "../../../lib/email/templates/article";
import { RoleAssignedEmail, RoleChangedEmail, RoleRemovedEmail, TierUpgradeEmail } from "../../../lib/email/templates/role-change";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.infinityvolume.com";

// Get user email — uses service role if available, otherwise falls back to
// querying the profiles table for a stored email field, or skips gracefully
async function getUserEmail(userId) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && url) {
    try {
      const admin = createAdminClient(url, serviceKey);
      const { data } = await admin.auth.admin.getUserById(userId);
      return data?.user?.email ?? null;
    } catch {}
  }
  // Fallback: query auth.users via regular client (works on server with cookie session)
  // This won't work for other users' emails — return null and skip email silently
  return null;
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, payload } = body;

  try {
    switch (type) {

      // ─── Human Intel ──────────────────────────────────────────────
      case "human_intel_answered": {
        const { requestId } = payload;
        const { data: req } = await supabase
          .from("human_intel_requests")
          .select("question, response, user_id, profiles!human_intel_requests_user_id_fkey(display_name)")
          .eq("id", requestId)
          .single();
        if (!req) break;
        const email = await getUserEmail(req.user_id);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Your research question has been answered — InfinityVolume",
          react: HumanIntelAnsweredEmail({ displayName: req.profiles?.display_name, question: req.question, response: req.response, platformUrl: SITE }),
        });
        break;
      }

      case "human_intel_followup": {
        const { requestId } = payload;
        const { data: req } = await supabase
          .from("human_intel_requests")
          .select("question, follow_up_question, user_id, profiles!human_intel_requests_user_id_fkey(display_name)")
          .eq("id", requestId)
          .single();
        if (!req) break;
        const email = await getUserEmail(req.user_id);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Our research team needs more information — InfinityVolume",
          react: HumanIntelFollowUpEmail({ displayName: req.profiles?.display_name, question: req.question, followUpQuestion: req.follow_up_question, platformUrl: SITE }),
        });
        break;
      }

      case "human_intel_denied": {
        const { requestId } = payload;
        const { data: req } = await supabase
          .from("human_intel_requests")
          .select("question, denial_reason, user_id, profiles!human_intel_requests_user_id_fkey(display_name)")
          .eq("id", requestId)
          .single();
        if (!req) break;
        const email = await getUserEmail(req.user_id);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Research request update — InfinityVolume",
          react: HumanIntelDeniedEmail({ displayName: req.profiles?.display_name, question: req.question, denialReason: req.denial_reason, platformUrl: SITE }),
        });
        break;
      }

      // ─── Article review ───────────────────────────────────────────
      case "article_approved": {
        const { articleId, channelId, channelName, submissionId } = payload;
        const { data: article } = await supabase
          .from("articles")
          .select("title, user_id, profiles!articles_user_id_fkey(display_name)")
          .eq("id", articleId)
          .single();
        if (!article) break;
        const email = await getUserEmail(article.user_id);
        if (!email) break;
        const articleUrl = channelId ? `${SITE}/member/channels/${channelId}/articles/${articleId}` : null;
        await sendEmail({
          to: email,
          subject: `Your article has been approved — InfinityVolume`,
          react: ArticleApprovedEmail({ displayName: article.profiles?.display_name, articleTitle: article.title, channelName, articleUrl, platformUrl: SITE }),
        });
        break;
      }

      case "article_changes_requested": {
        const { articleId, channelName, reviewerComment } = payload;
        const { data: article } = await supabase
          .from("articles")
          .select("title, user_id, profiles!articles_user_id_fkey(display_name)")
          .eq("id", articleId)
          .single();
        if (!article) break;
        const email = await getUserEmail(article.user_id);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Revisions requested on your article — InfinityVolume",
          react: ArticleChangesRequestedEmail({ displayName: article.profiles?.display_name, articleTitle: article.title, channelName, reviewerComment, platformUrl: SITE }),
        });
        break;
      }

      case "article_rejected": {
        const { articleId, channelName } = payload;
        const { data: article } = await supabase
          .from("articles")
          .select("title, user_id, profiles!articles_user_id_fkey(display_name)")
          .eq("id", articleId)
          .single();
        if (!article) break;
        const email = await getUserEmail(article.user_id);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Article submission update — InfinityVolume",
          react: ArticleRejectedEmail({ displayName: article.profiles?.display_name, articleTitle: article.title, channelName, platformUrl: SITE }),
        });
        break;
      }

      case "channel_invite": {
        const { userId, channelId, channelName, invitedByName } = payload;
        const email = await getUserEmail(userId);
        if (!email) break;
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
        await sendEmail({
          to: email,
          subject: `You've been added to ${channelName} — InfinityVolume`,
          react: PrivateChannelInviteEmail({ displayName: profile?.display_name, channelName, invitedByName, channelId, platformUrl: SITE }),
        });
        break;
      }

      // ─── Role / tier changes ──────────────────────────────────────
      case "role_assigned": {
        const { userId, newRole, displayName } = payload;
        const email = await getUserEmail(userId);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: `You've been assigned a new role — InfinityVolume`,
          react: RoleAssignedEmail({ displayName, newRole, platformUrl: SITE }),
        });
        break;
      }

      case "role_changed": {
        const { userId, oldRole, newRole, displayName } = payload;
        const email = await getUserEmail(userId);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Your role has been updated — InfinityVolume",
          react: RoleChangedEmail({ displayName, oldRole, newRole, platformUrl: SITE }),
        });
        break;
      }

      case "role_removed": {
        const { userId, removedRole, displayName } = payload;
        const email = await getUserEmail(userId);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: "Admin access removed — InfinityVolume",
          react: RoleRemovedEmail({ displayName, removedRole, platformUrl: SITE }),
        });
        break;
      }

      case "tier_upgrade": {
        const { userId, oldTier, newTier, displayName } = payload;
        const email = await getUserEmail(userId);
        if (!email) break;
        await sendEmail({
          to: email,
          subject: `You've been promoted to ${newTier} — InfinityVolume`,
          react: TierUpgradeEmail({ displayName, oldTier, newTier, platformUrl: SITE }),
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email-trigger] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
