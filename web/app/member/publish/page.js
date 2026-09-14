import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ArticleEditor from "../../../components/ArticleEditor";
import Link from "next/link";
import ArticleLikeShare from "../../../components/ArticleLikeShare";

export default async function PublishPage({ searchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { id, view, from } = await searchParams;
  const viewMode = !!view;
  let existingArticle = null;
  let isAuthor = false;
  let collaborators = [];

  if (id) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, body, status, published_at, created_at, updated_at, featured_image_url, tags, disclosed_holdings, own_critique, user_id")
      .eq("id", id)
      .single();
    existingArticle = data;
    if (existingArticle) {
      isAuthor = existingArticle.user_id === user.id;
      const { data: collabRows } = await supabase
        .from("article_collaborators")
        .select("user_id, accepted_at, profiles(display_name, admin_role)")
        .eq("article_id", id);
      collaborators = collabRows || [];
    }
  }

  // Fetch channels for the selector
  const { data: publicChannels } = await supabase
    .from("channels")
    .select("id, name, visibility")
    .eq("visibility", "public");
  const { data: userMemberships } = await supabase
    .from("channel_members")
    .select("channel_id, channels(id, name, visibility)")
    .eq("user_id", user.id)
    .eq("channels.visibility", "private");
  const privateChannels = (userMemberships || []).map(m => m.channels).filter(Boolean);

  let existingSubmissions = [];
  let reviewComments = [];
  if (existingArticle?.id) {
    const { data: subs } = await supabase
      .from("article_channel_submissions")
      .select("id, channel_id, status, channels(name)")
      .eq("article_id", existingArticle.id);
    existingSubmissions = subs || [];
    const submissionIds = existingSubmissions.map(s => s.id);
    if (submissionIds.length > 0) {
      const { data: comments } = await supabase
        .from("article_review_comments")
        .select("id, comment, selected_text, comment_type, resolved_at, created_at, profiles!article_review_comments_author_id_fkey(display_name, admin_role)")
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: true });
      reviewComments = comments || [];
    }
  }

  const isPublished = existingArticle?.status === "published";
  const hasPendingSubmissions = existingSubmissions.some(s => s.status === "pending");
  const hasChangesRequested = existingSubmissions.some(s => s.status === "changes_requested");

  // ── READ VIEW ──────────────────────────────────────────────────────────────
  if (viewMode && existingArticle) {
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, display_name, bio, professional_title, admin_role, omega_score, avatar_url")
      .eq("id", existingArticle.user_id)
      .single();
    const { data: collabRows } = await supabase
      .from("article_collaborators")
      .select("profiles(id, display_name, bio, professional_title, admin_role, omega_score, avatar_url)")
      .eq("article_id", existingArticle.id);
    const collabProfiles = (collabRows || []).map(r => r.profiles).filter(Boolean);

    const backHref = from ? `/member/channels/${from}` : "/member/articles";
    const backLabel = from ? "← Back to channel" : "← My Articles";
    const displayDate = existingArticle.published_at || existingArticle.updated_at || existingArticle.created_at;
    const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const articleUrl = `${siteBase}/member/publish?id=${existingArticle.id}&view=1${from ? `&from=${from}` : ""}`;

    const ROLE_COLORS = {
      super_admin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      research: "bg-green-500/20 text-green-400 border-green-500/30",
      technical: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      community: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    const ROLE_LABELS = { super_admin: "SA", research: "RA", technical: "TA", community: "CA" };

    function PersonCard({ person, label }) {
      if (!person) return null;
      const role = person.admin_role;
      return (
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-ink-700 overflow-hidden shrink-0 ring-1 ring-ink-600">
            {person.avatar_url
              ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-paper/40 font-display">
                  {person.display_name?.[0]?.toUpperCase() || "?"}
                </div>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {label && <span className="text-[9px] font-body text-paper/25 uppercase tracking-widest">{label}</span>}
              <span className="text-paper/80 text-sm font-body font-medium">{person.display_name}</span>
              {role && ROLE_LABELS[role] && (
                <span className={`text-[9px] font-body px-1.5 py-0.5 rounded border ${ROLE_COLORS[role] || "bg-ink-800 text-paper/40 border-ink-700"}`}>
                  {ROLE_LABELS[role]}
                </span>
              )}
              {person.omega_score > 0 && (
                <span className="text-sm font-mono text-paper/25">Ω {person.omega_score}</span>
              )}
            </div>
            {person.professional_title && (
              <p className="text-paper/40 text-xs font-body mt-0.5">{person.professional_title}</p>
            )}
            {person.bio && (
              <p className="text-paper/50 text-xs font-body mt-1.5 leading-relaxed">{person.bio}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href={backHref} className="text-paper/30 text-xs font-body hover:text-paper/60 mb-8 block">{backLabel}</Link>

        {existingArticle.featured_image_url && (
          <img src={existingArticle.featured_image_url} alt="" className="w-full h-64 object-cover rounded-xl mb-8" />
        )}

        <h1 className="font-display text-3xl text-paper leading-tight mb-3">{existingArticle.title}</h1>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {displayDate && (
            <span className="text-paper/30 text-xs font-body">
              {new Date(displayDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
          {isAuthor && (
            <Link href={`/member/publish?id=${existingArticle.id}`} className="ml-auto text-xs font-body text-paper/30 hover:text-brass-400">Edit ✎</Link>
          )}
        </div>

        {(existingArticle.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {existingArticle.tags.map(t => (
              <span key={t} className="text-[10px] font-body text-brass-400/70 bg-brass-400/10 px-2 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}

        <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-5 mb-10">
          <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-4">
            {collabProfiles.length > 0 ? "Author & Collaborators" : "Author"}
          </p>
          <div className="space-y-5">
            <PersonCard person={authorProfile} label={collabProfiles.length > 0 ? "Author" : null} />
            {collabProfiles.map(c => <PersonCard key={c.id} person={c} label="Collaborator" />)}
          </div>
          {existingArticle.disclosed_holdings && existingArticle.disclosed_holdings !== "NA" && (
            <div className="mt-4 pt-4 border-t border-ink-800">
              <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-1">Disclosed holdings</p>
              <p className="text-paper/50 text-xs font-body">{existingArticle.disclosed_holdings}</p>
            </div>
          )}
        </div>

        <div
          className="font-body text-paper/80 leading-relaxed text-[15px]
            [&_h2]:text-paper [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-paper [&_h3]:font-display [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_strong]:text-paper
            [&_a]:text-brass-400 [&_a]:no-underline hover:[&_a]:underline
            [&_blockquote]:border-l-2 [&_blockquote]:border-brass-400/40 [&_blockquote]:pl-4 [&_blockquote]:text-paper/50 [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1
            [&_img]:rounded-lg [&_img]:my-4 [&_img]:w-full"
          dangerouslySetInnerHTML={{ __html: existingArticle.body || "" }}
        />

        {existingArticle.own_critique && existingArticle.own_critique !== "TBD" && (
          <div className="mt-12 border border-ink-700 rounded-xl bg-ink-900/60 p-5">
            <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-2">Author's own critique / risks</p>
            <p className="text-paper/60 text-sm font-body leading-relaxed whitespace-pre-wrap">{existingArticle.own_critique}</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-ink-800">
          <ArticleLikeShare articleId={existingArticle.id} articleUrl={articleUrl} />
        </div>
      </main>
    );
  }

  // ── EDIT VIEW (Publish editor) ─────────────────────────────────────────────
  return (
    <main>
      <ArticleEditor
        articleId={existingArticle?.id ?? null}
        initialTitle={existingArticle?.title ?? ""}
        initialBody={existingArticle?.body ?? ""}
        initialFeaturedImageUrl={existingArticle?.featured_image_url ?? null}
        initialTags={existingArticle?.tags ?? []}
        initialDisclosedHoldings={existingArticle?.disclosed_holdings ?? ""}
        initialOwnCritique={existingArticle?.own_critique ?? ""}
        isAuthor={isAuthor}
        collaborators={collaborators}
        publicChannels={publicChannels || []}
        privateChannels={privateChannels}
        existingSubmissions={existingSubmissions}
        initialIsPublished={isPublished}
        hasPendingSubmissions={hasPendingSubmissions}
        hasChangesRequested={hasChangesRequested}
        reviewComments={reviewComments}
      />
    </main>
  );
}
