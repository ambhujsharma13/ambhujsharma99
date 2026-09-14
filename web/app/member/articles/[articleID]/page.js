import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";

export default async function ArticleReadPage({ params }) {
  const { articleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: article } = await supabase
    .from("articles")
    .select(`
      id, title, body, published_at, tags, featured_image_url,
      disclosed_holdings, own_critique, status,
      user_id,
      profiles!articles_user_id_fkey(
        id, display_name, bio, professional_title, admin_role, member_tier, omega_score,
        avatar_url, linkedin_url, socials
      )
    `)
    .eq("id", articleId)
    .single();

  if (!article || article.status !== "published") notFound();

  // Fetch collaborators with their profiles
  const { data: collabRows } = await supabase
    .from("article_collaborators")
    .select("profiles(id, display_name, bio, professional_title, admin_role, member_tier, omega_score, avatar_url)")
    .eq("article_id", articleId);
  const collaborators = (collabRows || []).map(r => r.profiles).filter(Boolean);

  // Fetch role definitions for badges
  const { data: roleDefinitions } = await supabase
    .from("admin_role_definitions")
    .select("role_key, abbreviation, label, badge_color");

  const roleMap = Object.fromEntries((roleDefinitions || []).map(r => [r.role_key, r]));
  const isAuthor = article.user_id === user.id;
  const author = article.profiles;

  const TIER_LABELS = { member: "Member", captain: "Captain", admiral: "Admiral", commodore: "Commodore" };

  function RolePill({ role }) {
    if (!role) return null;
    const def = roleMap[role];
    if (!def) return null;
    const colors = {
      super_admin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      research: "bg-green-500/20 text-green-400 border-green-500/30",
      technical: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      community: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return (
      <span className={`text-[10px] font-body px-1.5 py-0.5 rounded border ${colors[role] || "bg-ink-800 text-paper/50 border-ink-700"}`}>
        {def.abbreviation}
      </span>
    );
  }

  function PersonCard({ person }) {
    if (!person) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-ink-700 overflow-hidden shrink-0">
          {person.avatar_url
            ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-paper/40 text-sm font-display">
                {person.display_name?.[0]?.toUpperCase() || "?"}
              </div>
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/member/profile/${person.id}`} className="text-paper/90 text-sm font-body font-medium hover:text-brass-400 transition-colors">
              {person.display_name}
            </Link>
            <RolePill role={person.admin_role} />
            {person.omega_score > 0 && (
              <span className="text-[10px] font-mono text-paper/30">Ω {person.omega_score}</span>
            )}
          </div>
          {person.professional_title && (
            <p className="text-paper/40 text-[11px] font-body">{person.professional_title}</p>
          )}
          {person.bio && (
            <p className="text-paper/50 text-xs font-body mt-1 line-clamp-2 leading-relaxed">{person.bio}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Back link */}
      <Link href="/member/articles" className="text-paper/30 text-xs font-body hover:text-paper/60 mb-6 block">
        ← My Articles
      </Link>

      {/* Featured image */}
      {article.featured_image_url && (
        <div className="rounded-xl overflow-hidden mb-8 max-h-72">
          <img src={article.featured_image_url} alt="" className="w-full h-72 object-cover" />
        </div>
      )}

      {/* Title */}
      <h1 className="font-display text-3xl text-paper mb-3 leading-tight">{article.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-paper/30 text-xs font-body">
          {new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </span>
        {(article.tags || []).slice(0, 5).map(t => (
          <span key={t} className="text-[10px] font-body text-brass-400/70 bg-brass-400/10 px-1.5 py-0.5 rounded">
            {t}
          </span>
        ))}
        {isAuthor && (
          <Link href={`/member/publish?id=${article.id}`} className="ml-auto text-xs font-body text-paper/30 hover:text-brass-400 transition-colors">
            Edit ✎
          </Link>
        )}
      </div>

      {/* Author + collaborator card */}
      <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-5 mb-8">
        <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide mb-3">
          {collaborators.length > 0 ? "Author & Collaborators" : "Author"}
        </p>
        <div className="space-y-4">
          <PersonCard person={author} />
          {collaborators.map(c => <PersonCard key={c.id} person={c} />)}
        </div>
        {article.disclosed_holdings && (
          <div className="mt-4 pt-4 border-t border-ink-800">
            <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide mb-1">Disclosed holdings</p>
            <p className="text-paper/50 text-xs font-body">{article.disclosed_holdings}</p>
          </div>
        )}
      </div>

      {/* Article body — full length, no scroll box */}
      <div
        className="prose prose-invert max-w-none font-body text-paper/80 leading-relaxed
          prose-headings:text-paper prose-headings:font-display
          prose-a:text-brass-400 prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-brass-400 prose-blockquote:text-paper/50
          prose-strong:text-paper prose-code:text-brass-400
          prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: article.body || "" }}
      />

      {/* Own critique */}
      {article.own_critique && (
        <div className="mt-10 border border-ink-700 rounded-xl bg-ink-900/60 p-5">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide mb-2">Author's own critique / risks</p>
          <p className="text-paper/60 text-sm font-body leading-relaxed whitespace-pre-wrap">{article.own_critique}</p>
        </div>
      )}
    </main>
  );
}
