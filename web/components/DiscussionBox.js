import { createClient } from "../lib/supabase/server";
import Link from "next/link";

function readingMinutes(body) {
  const words = (body || "").replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function DiscussionBox() {
  // Check auth — unauthenticated users get a login prompt
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mb-4">
        <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest mb-2">Discussion</p>
        <div className="border border-ink-700 rounded-lg bg-ink-900/60 p-3 text-center">
          <p className="text-paper/40 text-xs font-body mb-2">Members-only content</p>
          <Link href="/sign-in" className="text-brass-400 text-xs font-body hover:text-brass-300 transition-colors">
            Sign in to read →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch homepage articles (max 10, newest first)
  const { data: homepageEntries } = await supabase
    .from("homepage_articles")
    .select("article_id, added_at")
    .order("added_at", { ascending: false })
    .limit(10);

  if (!homepageEntries?.length) {
    return (
      <div className="mb-4">
        <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest mb-2">Discussion</p>
        <p className="text-paper/20 text-xs font-body">No featured articles yet.</p>
      </div>
    );
  }

  const articleIds = homepageEntries.map(e => e.article_id);

  // Fetch articles with their PUBLIC channel links only
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, body, article_channels(channel_id, channels(visibility))")
    .in("id", articleIds);

  // Fetch like + comment counts
  const { data: likes } = await supabase
    .from("article_likes").select("article_id").in("article_id", articleIds);
  const { data: comments } = await supabase
    .from("article_comments").select("article_id").in("article_id", articleIds);

  const likesByArticle = {};
  for (const l of likes || []) likesByArticle[l.article_id] = (likesByArticle[l.article_id] || 0) + 1;
  const commentsByArticle = {};
  for (const c of comments || []) commentsByArticle[c.article_id] = (commentsByArticle[c.article_id] || 0) + 1;

  // Sort by homepage pin order
  const ordered = homepageEntries
    .map(e => articles?.find(a => a.id === e.article_id))
    .filter(Boolean);

  return (
    <div className="mb-4">
      <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest mb-2">Discussion</p>
      <div className="space-y-2">
        {ordered.map(a => {
          // Prefer PUBLIC channel link
          const publicChannel = a.article_channels?.find(ac => ac.channels?.visibility === "public");
          const anyChannel = a.article_channels?.[0];
          const channelId = publicChannel?.channel_id || anyChannel?.channel_id;
          const reactions = (likesByArticle[a.id] || 0) + (commentsByArticle[a.id] || 0) * 2;
          const mins = readingMinutes(a.body);
          const href = channelId
            ? `/member/channels/${channelId}/articles/${a.id}`
            : `/member/publish?id=${a.id}&view=1`;
          return (
            <Link
              key={a.id}
              href={href}
              className="block p-2 rounded-lg hover:bg-ink-800/60 transition-colors group"
            >
              <p className="text-paper/80 text-xs font-body font-medium leading-snug group-hover:text-brass-400 transition-colors line-clamp-2">
                {a.title}
              </p>
              <p className="text-paper/30 text-[10px] font-body mt-1">
                {mins} min · {reactions > 0 ? `${reactions} reaction${reactions === 1 ? "" : "s"}` : "Be first to react"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
