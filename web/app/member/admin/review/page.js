import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import ReviewQueueItem from "../../../../components/ReviewQueueItem";

export const metadata = { title: "Article Review Queue — InfinityVolume" };

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("admin_role")
    .eq("id", user.id)
    .single();

  if (!["super_admin", "research"].includes(profile?.admin_role)) {
    redirect("/member/settings");
  }

  // Fetch pending + recent submissions — public channels only.
  // Private channels auto-publish without RA review so they never appear here.
  const { data: allSubmissions } = await supabase
    .from("article_channel_submissions")
    .select(`
      id, status, created_at, reviewed_at,
      article_id,
      articles (
        id, title, body, tags, published_at,
        profiles!articles_user_id_fkey (id, display_name, admin_role)
      ),
      channels (id, name, visibility),
      profiles!article_channel_submissions_reviewer_id_fkey (display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Filter to public channels only — private channels auto-publish without RA review
  const submissions = (allSubmissions || []).filter(s => s.channels?.visibility === "public");

  // Fetch review comments for all these submissions
  const submissionIds = (submissions || []).map(s => s.id);
  let commentsBySubmission = {};
  if (submissionIds.length > 0) {
    const { data: comments } = await supabase
      .from("article_review_comments")
      .select("*, profiles!article_review_comments_author_id_fkey(display_name, admin_role)")
      .in("submission_id", submissionIds)
      .order("created_at", { ascending: true });

    // Also fetch author_response comments by article_id (in case submission ID changed on resubmit)
    const articleIds = [...new Set((submissions || []).map(s => s.article_id))];
    const { data: authorResponses } = await supabase
      .from("article_review_comments")
      .select("*, profiles!article_review_comments_author_id_fkey(display_name, admin_role)")
      .in("article_id", articleIds)
      .eq("comment_type", "author_response")
      .order("created_at", { ascending: true });

    // Merge — deduplicate by id
    const allComments = [...(comments || [])];
    for (const r of authorResponses || []) {
      if (!allComments.find(c => c.id === r.id)) {
        // Attach to the matching submission by article_id
        const sub = (submissions || []).find(s => s.article_id === r.article_id);
        if (sub) r.submission_id = sub.id;
        allComments.push(r);
      }
    }

    for (const c of allComments) {
      if (!commentsBySubmission[c.submission_id]) commentsBySubmission[c.submission_id] = [];
      commentsBySubmission[c.submission_id].push(c);
    }
  }

  const pending = (submissions || []).filter(s => s.status === "pending");
  const reviewed = (submissions || []).filter(s => s.status !== "pending");

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-display text-xl text-paper">Article Review Queue</h1>
          <p className="text-paper/40 text-xs font-body mt-0.5">
            Review articles submitted for public and private channel publication.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="text-xs font-body bg-loss/20 text-loss px-2 py-1 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 && reviewed.length === 0 && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <p className="text-paper/40 font-body text-sm">No submissions yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
            Pending review — {pending.length}
          </p>
          <div className="space-y-4">
            {pending.map(sub => (
              <ReviewQueueItem
                key={sub.id}
                submission={sub}
                comments={commentsBySubmission[sub.id] || []}
                reviewerId={user.id}
              />
            ))}
          </div>
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
            Recently reviewed — {reviewed.length}
          </p>
          <div className="space-y-3">
            {reviewed.map(sub => (
              <ReviewQueueItem
                key={sub.id}
                submission={sub}
                comments={commentsBySubmission[sub.id] || []}
                reviewerId={user.id}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
