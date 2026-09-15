import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ArticlesTable from "../../../components/ArticlesTable";

function countWords(html) {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export default async function MyArticlesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch published articles
  const { data: publishedArticlesRaw } = await supabase
    .from("articles")
    .select("id, title, published_at, updated_at, body, tags, is_pinned")
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  // Also fetch draft articles that have active channel submissions
  // (pending or changes_requested) — these belong in My Articles too
  // since the author submitted them for review
  const { data: draftWithSubmissions } = await supabase
    .from("article_channel_submissions")
    .select("article_id, articles!inner(id, title, published_at, updated_at, body, tags, is_pinned, status)")
    .eq("submitted_by", user.id)
    .in("status", ["pending", "changes_requested"]);

  // Merge: published articles + drafts-with-submissions (deduplicated)
  const seenIds = new Set((publishedArticlesRaw || []).map(a => a.id));
  const extraArticles = (draftWithSubmissions || [])
    .map(r => r.articles)
    .filter(a => a && !seenIds.has(a.id))
    .reduce((acc, a) => { if (!acc.find(x => x.id === a.id)) acc.push(a); return acc; }, []);

  const ownArticlesRaw = [...(publishedArticlesRaw || []), ...extraArticles];

  // Fetch channel submission status for own articles so the author
  // can see which channels are pending/approved/rejected
  const ownArticleIds = (ownArticlesRaw || []).map((a) => a.id);
  let submissionsByArticle = {};
  if (ownArticleIds.length > 0) {
    const { data: submissions } = await supabase
      .from("article_channel_submissions")
      .select("article_id, status, channels(name, visibility)")
      .in("article_id", ownArticleIds);
    for (const s of submissions || []) {
      // Only show badges for public channel submissions — private channels
      // auto-publish and don't need RA review status shown to the author
      if (s.channels?.visibility === "private") continue;
      if (!submissionsByArticle[s.article_id]) submissionsByArticle[s.article_id] = [];
      submissionsByArticle[s.article_id].push({ status: s.status, channelName: s.channels?.name });
    }
  }

  // Shared, published articles — mirrors the same own/shared split
  // already built for Saved Drafts. Confirmed a real gap during
  // testing: a collaborator invite gets accepted, but if the article
  // is already published (not a draft), it previously had nowhere to
  // show up at all — Saved Drafts explicitly excludes published pieces,
  // and this page only ever showed the user's own work.
  const { data: collabRowsForUser } = await supabase
    .from("article_collaborators")
    .select("article_id")
    .eq("user_id", user.id);
  const sharedArticleIds = (collabRowsForUser || []).map((c) => c.article_id);

  let sharedArticlesRaw = [];
  if (sharedArticleIds.length > 0) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, published_at, body, tags, user_id, profiles!articles_user_id_fkey(display_name)")
      .in("id", sharedArticleIds)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    sharedArticlesRaw = data || [];
  }

  const allArticleIds = [...(ownArticlesRaw || []).map((a) => a.id), ...sharedArticlesRaw.map((a) => a.id)];
  let collaboratorsByArticle = {};
  if (allArticleIds.length > 0) {
    const { data: collabRows } = await supabase
      .from("article_collaborators")
      .select("article_id, profiles(display_name)")
      .in("article_id", allArticleIds);
    for (const row of collabRows || []) {
      if (!collaboratorsByArticle[row.article_id]) collaboratorsByArticle[row.article_id] = [];
      collaboratorsByArticle[row.article_id].push(row.profiles?.display_name || "Member");
    }
  }

  const ownArticles = (ownArticlesRaw || []).map((a) => ({
    id: a.id,
    title: a.title,
    dateValue: a.published_at || a.updated_at,
    wordCount: countWords(a.body),
    tags: a.tags || [],
    is_pinned: a.is_pinned || false,
    isOwner: true,
    authorName: "You",
    collaboratorNames: collaboratorsByArticle[a.id] || [],
    submissions: submissionsByArticle[a.id] || [],
  }));

  const sharedArticles = sharedArticlesRaw.map((a) => ({
    id: a.id,
    title: a.title,
    dateValue: a.published_at,
    wordCount: countWords(a.body),
    tags: a.tags || [],
    authorName: a.profiles?.display_name || "Unknown",
    collaboratorNames: collaboratorsByArticle[a.id] || [],
  }));

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">My articles</h1>

      <div className="mb-8">
        <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
          Your articles ({ownArticles.length})
        </p>
        <ArticlesTable
          articles={ownArticles}
          emptyMessage="Nothing published yet — write your first piece from Publish."
          dateLabel="Published"
          showPin={true}
        />
      </div>

      <div>
        <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
          Shared with you ({sharedArticles.length})
        </p>
        <ArticlesTable
          articles={sharedArticles}
          emptyMessage="No published articles have been shared with you yet."
          dateLabel="Published"
        />
      </div>
    </main>
  );
}
