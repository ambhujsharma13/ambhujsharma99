import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export default async function DraftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // RLS already restricts drafts to their own author, so this only ever
  // returns the signed-in user's own unpublished work, but filtering by
  // user_id explicitly here too keeps the query's intent readable.
  const { data: drafts } = await supabase
    .from("articles")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">Saved drafts</h1>

      {!drafts || drafts.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">
          No drafts yet — start writing from{" "}
          <Link href="/member/publish" className="text-brass-400 hover:underline">
            Publish
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-ink-800 border-t border-b border-ink-800">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/member/publish?id=${draft.id}`}
                className="flex items-center justify-between py-3 hover:bg-ink-800/40 transition-colors px-2 -mx-2"
              >
                <span className="text-paper/80 font-body">{draft.title || "Untitled"}</span>
                <span className="text-paper/30 text-xs font-body">
                  {new Date(draft.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
