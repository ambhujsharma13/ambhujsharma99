import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { removeBookmark } from "../../../lib/bookmark-actions";
import BookmarkButton from "../../../components/BookmarkButton";

export const metadata = {
  title: "Bookmarks — InfinityVolume",
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ArticleBookmarkRow({ bookmark }) {
  const a = bookmark.articles;
  if (!a) return null;

  const channelName = a.article_channels?.[0]?.channels?.name;
  const channelVisibility = a.article_channels?.[0]?.channels?.visibility;
  const isPublic = a.status === "published";

  return (
    <tr className="border-b border-ink-800 hover:bg-ink-800/30 transition-colors group">
      <td className="py-3 pr-4">
        <div className="flex items-start gap-2">
          <Link
            href={`/member/articles/${a.id}`}
            className="text-paper/90 font-body text-sm hover:text-brass-400 transition-colors line-clamp-2"
          >
            {a.title}
          </Link>
        </div>
        {a.tags && a.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {a.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-body text-paper/30 bg-ink-800 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="py-3 pr-4 text-paper/50 text-xs font-body whitespace-nowrap">
        {a.profiles?.display_name || "Unknown"}
      </td>
      <td className="py-3 pr-4">
        {/* Source: where this content lives */}
        <span className={`text-[10px] font-body px-1.5 py-0.5 rounded ${
          isPublic ? "text-gain bg-gain/10" : "text-paper/30 bg-ink-800"
        }`}>
          {isPublic ? "Published" : "Draft"}
        </span>
      </td>
      <td className="py-3 pr-4 text-paper/40 text-xs font-body whitespace-nowrap">
        {channelName ? (
          <span className="flex items-center gap-1">
            {channelVisibility === "private" && <span title="Private channel">🔒</span>}
            {channelName}
          </span>
        ) : "—"}
      </td>
      <td className="py-3 pr-4 text-paper/30 text-xs font-mono whitespace-nowrap">
        {timeAgo(bookmark.created_at)}
      </td>
      <td className="py-3 text-right">
        <BookmarkButton articleId={a.id} initiallyBookmarked={true} />
      </td>
    </tr>
  );
}

function PostBookmarkRow({ bookmark }) {
  const p = bookmark.discussion_posts;
  if (!p) return null;

  const channel = p.channels;
  const isPrivate = channel?.visibility === "private";
  const excerpt = p.content?.slice(0, 120) + (p.content?.length > 120 ? "…" : "");

  return (
    <tr className="border-b border-ink-800 hover:bg-ink-800/30 transition-colors group">
      <td className="py-3 pr-4">
        <Link
          href={`/member/channels/${channel?.id}#post-${p.id}`}
          className="text-paper/80 font-body text-sm hover:text-brass-400 transition-colors"
        >
          {excerpt || "—"}
        </Link>
      </td>
      <td className="py-3 pr-4 text-paper/50 text-xs font-body whitespace-nowrap">
        {p.profiles?.display_name || "Unknown"}
      </td>
      <td className="py-3 pr-4">
        <span className="text-[10px] font-body px-1.5 py-0.5 rounded text-paper/50 bg-ink-800">
          Discussion
        </span>
      </td>
      <td className="py-3 pr-4 text-paper/40 text-xs font-body whitespace-nowrap">
        {channel ? (
          <span className="flex items-center gap-1">
            {isPrivate && <span title="Private channel">🔒</span>}
            {channel.name}
          </span>
        ) : "—"}
      </td>
      <td className="py-3 pr-4 text-paper/30 text-xs font-mono whitespace-nowrap">
        {timeAgo(bookmark.created_at)}
      </td>
      <td className="py-3 text-right">
        <BookmarkButton postId={p.id} initiallyBookmarked={true} />
      </td>
    </tr>
  );
}

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Fetch all bookmarks with their referenced content in one query each.
  // Articles: join profiles (author), tags, and article_channels → channels
  //   for the channel name/visibility context.
  // Posts: join channels (name + visibility) and profiles (author).
  // Ordered by bookmark creation time (most recently bookmarked first).
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select(`
      id,
      content_type,
      created_at,
      articles (
        id, title, status, tags,
        profiles!articles_user_id_fkey (display_name),
        article_channels (
          channels (id, name, visibility)
        )
      ),
      discussion_posts (
        id, content, created_at,
        channels (id, name, visibility),
        profiles!discussion_posts_user_id_fkey (display_name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const articleBookmarks = (bookmarks || []).filter((b) => b.content_type === "article");
  const postBookmarks = (bookmarks || []).filter((b) => b.content_type === "discussion_post");
  const total = (bookmarks || []).length;

  const TABLE_HEADERS = (
    <tr className="text-left text-paper/40 font-body text-xs uppercase tracking-wide border-b border-ink-700">
      <th className="py-2 pr-4 font-medium">Title / Content</th>
      <th className="py-2 pr-4 font-medium whitespace-nowrap">Author</th>
      <th className="py-2 pr-4 font-medium">Type</th>
      <th className="py-2 pr-4 font-medium">Channel</th>
      <th className="py-2 pr-4 font-medium whitespace-nowrap">Saved</th>
      <th className="py-2 font-medium text-right">•</th>
    </tr>
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-xl text-paper">Bookmarks</h1>
        {total > 0 && (
          <span className="text-paper/30 text-xs font-body">{total} saved</span>
        )}
      </div>

      {total === 0 ? (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <p className="text-paper/40 font-body text-sm mb-1">Nothing saved yet.</p>
          <p className="text-paper/25 text-xs font-body">
            Use the bookmark icon on any article or channel post to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {articleBookmarks.length > 0 && (
            <section>
              <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
                Articles — {articleBookmarks.length}
              </p>
              <div className="border border-ink-700 rounded-lg bg-ink-900 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>{TABLE_HEADERS}</thead>
                  <tbody>
                    {articleBookmarks.map((b) => (
                      <ArticleBookmarkRow key={b.id} bookmark={b} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {postBookmarks.length > 0 && (
            <section>
              <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
                Discussion Posts — {postBookmarks.length}
              </p>
              <div className="border border-ink-700 rounded-lg bg-ink-900 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>{TABLE_HEADERS}</thead>
                  <tbody>
                    {postBookmarks.map((b) => (
                      <PostBookmarkRow key={b.id} bookmark={b} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
