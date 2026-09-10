import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ArticlesTable from "../../../components/ArticlesTable";

// Word count is computed here from the stored HTML body rather than
// persisted as its own column — always accurate against the actual
// saved content, and avoids a schema migration + keeping a derived
// value in sync on every save.
function countWords(html) {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export default async function DraftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Own drafts — RLS also allows this, but the explicit .eq keeps the
  // query's intent readable rather than relying on RLS alone to shape
  // the result set.
  const { data: ownDraftsRaw } = await supabase
    .from("articles")
    .select("id, title, updated_at, body, tags")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  // Shared drafts — articles where this user is a listed collaborator
  // rather than the author. Requires the articles SELECT policy to
  // actually include collaborators (a real, separate gap found and
  // fixed alongside this feature — collaborators previously couldn't
  // see a draft at all, only edit one they already had a direct link
  // to).
  const { data: collabRows, error: collabError } = await supabase
    .from("article_collaborators")
    .select("article_id")
    .eq("user_id", user.id);
  if (collabError) console.error("Failed to fetch article_collaborators:", JSON.stringify(collabError));
  const sharedArticleIds = (collabRows || []).map((c) => c.article_id);

  let sharedDraftsRaw = [];
  if (sharedArticleIds.length > 0) {
    const { data, error: sharedError } = await supabase
      .from("articles")
      .select("id, title, updated_at, body, tags, user_id, profiles!articles_user_id_fkey(display_name)")
      .in("id", sharedArticleIds)
      .eq("status", "draft")
      .order("updated_at", { ascending: false });
    if (sharedError) console.error("Failed to fetch shared articles:", JSON.stringify(sharedError));
    sharedDraftsRaw = data || [];
  }

  // Collaborator names fetched for every draft (own + shared) in one
  // batch, then grouped by article_id — same pattern used elsewhere in
  // this project to avoid an extra query per row.
  const allDraftIds = [...(ownDraftsRaw || []).map((d) => d.id), ...sharedDraftsRaw.map((d) => d.id)];
  let collaboratorsByArticle = {};
  if (allDraftIds.length > 0) {
    const { data: allCollabRows } = await supabase
      .from("article_collaborators")
      .select("article_id, profiles(display_name)")
      .in("article_id", allDraftIds);
    for (const row of allCollabRows || []) {
      if (!collaboratorsByArticle[row.article_id]) collaboratorsByArticle[row.article_id] = [];
      collaboratorsByArticle[row.article_id].push(row.profiles?.display_name || "Member");
    }
  }

  const ownDrafts = (ownDraftsRaw || []).map((d) => ({
    id: d.id,
    title: d.title,
    dateValue: d.updated_at,
    wordCount: countWords(d.body),
    tags: d.tags || [],
    authorName: "You",
    collaboratorNames: collaboratorsByArticle[d.id] || [],
  }));

  const sharedDrafts = sharedDraftsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    dateValue: d.updated_at,
    wordCount: countWords(d.body),
    tags: d.tags || [],
    authorName: d.profiles?.display_name || "Unknown",
    collaboratorNames: collaboratorsByArticle[d.id] || [],
  }));

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">Saved drafts</h1>

      <div className="mb-8">
        <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
          Your drafts ({ownDrafts.length})
        </p>
        <ArticlesTable articles={ownDrafts} emptyMessage="No drafts yet — start writing from Publish." />
      </div>

      <div>
        <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
          Shared with you ({sharedDrafts.length})
        </p>
        <ArticlesTable articles={sharedDrafts} emptyMessage="No drafts have been shared with you yet." />
      </div>
    </main>
  );
}
