import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export default async function MyArticlesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, published_at")
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">My articles</h1>

      {!articles || articles.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">
          Nothing published yet — write your first piece from{" "}
          <Link href="/member/publish" className="text-brass-400 hover:underline">
            Publish
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-ink-800 border-t border-b border-ink-800">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/member/publish?id=${article.id}`}
                className="flex items-center justify-between py-3 hover:bg-ink-800/40 transition-colors px-2 -mx-2"
              >
                <span className="text-paper/80 font-body">{article.title}</span>
                <span className="text-paper/30 text-xs font-body">
                  {new Date(article.published_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
