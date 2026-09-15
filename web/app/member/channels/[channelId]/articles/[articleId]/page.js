import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../../lib/supabase/server";
import ArticleLikeShare from "../../../../../../components/ArticleLikeShare";
import ArticleComments from "../../../../../../components/ArticleComments";

export default async function ChannelArticlePage({ params }) {
  const { channelId, articleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Fetch channel info
  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, visibility")
    .eq("id", channelId)
    .single();
  if (!channel) notFound();

  // Fetch article
  const { data: article } = await supabase
    .from("articles")
    .select(`id, title, body, published_at, created_at, updated_at, tags, featured_image_url, disclosed_holdings, own_critique, status, user_id,
      profiles!articles_user_id_fkey(id, display_name, bio, professional_title, admin_role, omega_score, avatar_url)`)
    .eq("id", articleId)
    .single();
  if (!article) notFound();

  // Verify article is actually published in this channel
  const { data: channelLink } = await supabase
    .from("article_channels")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("channel_id", channelId)
    .single();
  if (!channelLink) notFound();

  // Fetch collaborators
  const { data: collabRows } = await supabase
    .from("article_collaborators")
    .select("profiles(id, display_name, bio, professional_title, admin_role, omega_score, avatar_url)")
    .eq("article_id", articleId);
  const collaborators = (collabRows || []).map(r => r.profiles).filter(Boolean);

  const isAuthor = article.user_id === user.id;
  const author = article.profiles;
  const displayDate = article.published_at || article.updated_at || article.created_at;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${siteBase}/member/channels/${channelId}/articles/${articleId}`;

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
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] font-body text-paper/30 mb-8 flex-wrap">
        <Link href="/member/channels" className="hover:text-paper/60 transition-colors">Channels</Link>
        <span>/</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] border ${
          channel.visibility === "private"
            ? "bg-ink-800 text-paper/40 border-ink-700"
            : "bg-ink-800 text-paper/40 border-ink-700"
        }`}>
          {channel.visibility === "private" ? "🔒 Private" : "🌐 Public"}
        </span>
        <Link href={`/member/channels/${channelId}`} className="hover:text-paper/60 transition-colors font-medium">
          {channel.name}
        </Link>
        <span>/</span>
        <span className="text-paper/50 truncate max-w-[200px]">{article.title}</span>
        {isAuthor && (
          <Link href={`/member/publish?id=${article.id}`} className="ml-auto text-paper/25 hover:text-brass-400 transition-colors">
            Edit ✎
          </Link>
        )}
      </nav>

      {/* Featured image */}
      {article.featured_image_url && (
        <img src={article.featured_image_url} alt="" className="w-full h-64 object-cover rounded-xl mb-8" />
      )}

      {/* Title */}
      <h1 className="font-display text-3xl text-paper leading-tight mb-3">{article.title}</h1>

      {/* Date + tags */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {displayDate && (
          <span className="text-paper/30 text-xs font-body">
            {new Date(displayDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        )}
      </div>
      {(article.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {article.tags.map(t => (
            <span key={t} className="text-[10px] font-body text-brass-400/70 bg-brass-400/10 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      )}

      {/* Author + collaborators card */}
      <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-5 mb-10">
        <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-4">
          {collaborators.length > 0 ? "Author & Collaborators" : "Author"}
        </p>
        <div className="space-y-5">
          <PersonCard person={author} label={collaborators.length > 0 ? "Author" : null} />
          {collaborators.map(c => <PersonCard key={c.id} person={c} label="Collaborator" />)}
        </div>
        {article.disclosed_holdings && article.disclosed_holdings !== "NA" && (
          <div className="mt-4 pt-4 border-t border-ink-800">
            <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-1">Disclosed holdings</p>
            <p className="text-paper/50 text-xs font-body">{article.disclosed_holdings}</p>
          </div>
        )}
      </div>

      {/* Article body */}
      <div
        className="font-body text-paper/80 leading-relaxed text-[15px]
          [&_h2]:text-paper [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
          [&_h3]:text-paper [&_h3]:font-display [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:mb-4 [&_strong]:text-paper
          [&_a]:text-brass-400 [&_a]:no-underline hover:[&_a]:underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-brass-400/40 [&_blockquote]:pl-4 [&_blockquote]:text-paper/50 [&_blockquote]:italic
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1
          [&_img]:rounded-lg [&_img]:my-4 [&_img]:w-full"
        dangerouslySetInnerHTML={{ __html: article.body || "" }}
      />

      {/* Own critique */}
      {article.own_critique && article.own_critique !== "TBD" && (
        <div className="mt-12 border border-ink-700 rounded-xl bg-ink-900/60 p-5">
          <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-2">Author's own critique / risks</p>
          <p className="text-paper/60 text-sm font-body leading-relaxed whitespace-pre-wrap">{article.own_critique}</p>
        </div>
      )}

      {/* Like / Share / Comment */}
      <div className="mt-10 pt-6 border-t border-ink-800">
        <ArticleLikeShare articleId={article.id} channelId={channelId} articleUrl={articleUrl} />
      </div>

      {/* Comments section */}
      <ArticleComments articleId={articleId} channelId={channelId} />
    </main>
  );
}
