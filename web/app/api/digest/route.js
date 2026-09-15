import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendEmail, getUserEmail } from "../../../lib/email/send";
import { AuthorDigestEmail } from "../../../lib/email/templates/digest";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.infinityvolume.com";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 48 hours ago
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Find all comments posted in the last 48 hours
  const { data: recentComments } = await admin
    .from("article_comments")
    .select("article_id, channel_id, content, created_at, profiles!article_comments_user_id_fkey(display_name)")
    .gte("created_at", since);

  // Find all likes in the last 48 hours
  const { data: recentLikes } = await admin
    .from("article_likes")
    .select("article_id")
    .gte("created_at", since);

  // Build engagement map per article
  const engagementByArticle = {};
  for (const c of recentComments || []) {
    if (!engagementByArticle[c.article_id]) engagementByArticle[c.article_id] = { comments: [], likes: 0 };
    engagementByArticle[c.article_id].comments.push({ author: c.profiles?.display_name, content: c.content, channelId: c.channel_id });
  }
  for (const l of recentLikes || []) {
    if (!engagementByArticle[l.article_id]) engagementByArticle[l.article_id] = { comments: [], likes: 0 };
    engagementByArticle[l.article_id].likes++;
  }

  if (Object.keys(engagementByArticle).length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "No engagement in 48h" });
  }

  // Fetch articles with their authors
  const articleIds = Object.keys(engagementByArticle);
  const { data: articles } = await admin
    .from("articles")
    .select("id, title, user_id, profiles!articles_user_id_fkey(display_name), article_channels(channel_id, channels(visibility))")
    .in("id", articleIds);

  // Group by author
  const byAuthor = {};
  for (const article of articles || []) {
    const uid = article.user_id;
    if (!byAuthor[uid]) byAuthor[uid] = { displayName: article.profiles?.display_name, articles: [] };
    const eng = engagementByArticle[article.id];
    const publicChannel = article.article_channels?.find(ac => ac.channels?.visibility === "public");
    const channelId = publicChannel?.channel_id || article.article_channels?.[0]?.channel_id;
    byAuthor[uid].articles.push({
      title: article.title,
      newComments: eng.comments.length,
      newLikes: eng.likes,
      recentComments: eng.comments,
      url: channelId ? `${SITE}/member/channels/${channelId}/articles/${article.id}` : null,
    });
  }

  let sent = 0;
  for (const [userId, data] of Object.entries(byAuthor)) {
    // Only send if meaningful engagement (1+ comment OR 3+ likes)
    const totalComments = data.articles.reduce((s, a) => s + a.newComments, 0);
    const totalLikes = data.articles.reduce((s, a) => s + a.newLikes, 0);
    if (totalComments === 0 && totalLikes < 3) continue;

    const email = await getUserEmail(admin, userId);
    if (!email) continue;

    const result = await sendEmail({
      to: email,
      subject: `Your InfinityVolume digest — ${totalComments} comment${totalComments !== 1 ? "s" : ""}, ${totalLikes} like${totalLikes !== 1 ? "s" : ""}`,
      react: AuthorDigestEmail({ displayName: data.displayName, articles: data.articles, platformUrl: SITE }),
    });
    if (result.ok) sent++;
  }

  return NextResponse.json({ ok: true, sent, authors: Object.keys(byAuthor).length });
}
