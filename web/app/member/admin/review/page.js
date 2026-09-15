import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import ReviewQueueItem from "../../../../components/ReviewQueueItem";
import HomepageReviewList from "../../../../components/HomepageReviewList";
import ResearchQueue from "../../../../components/ResearchQueue";

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

  // Build a map of all channels per article
  const { data: allArticleSubmissions } = await supabase
    .from("article_channel_submissions")
    .select("article_id, channel_id, status, channels(id, name, visibility)")
    .in("article_id", [...new Set((submissions || []).map(s => s.article_id))]);

  const channelsByArticle = {};
  for (const s of allArticleSubmissions || []) {
    if (!channelsByArticle[s.article_id]) channelsByArticle[s.article_id] = [];
    channelsByArticle[s.article_id].push({ id: s.channel_id, name: s.channels?.name, visibility: s.channels?.visibility, status: s.status });
  }

  // Fetch current homepage articles (max 10)
  const { data: homepageArticles } = await supabase
    .from("homepage_articles")
    .select("article_id")
    .order("added_at", { ascending: false })
    .limit(10);
  const homepageArticleIds = new Set((homepageArticles || []).map(h => h.article_id));
  const isSA = profile?.admin_role === "super_admin";

  // Human Intel queue — all requests, RA and SA can see all
  const { data: intelRequests } = await supabase
    .from("human_intel_requests")
    .select("id, question, context, category, status, response, follow_up_question, denial_reason, created_at, accepted_by, accepted_at, answered_at, profiles!human_intel_requests_user_id_fkey(id, display_name, omega_score, admin_role)")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl text-paper">Article Review Queue</h1>
          <p className="text-paper/40 text-xs font-body mt-0.5">
            Review articles submitted for public and private channel publication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pending.length > 0 && (
            <span className="text-xs font-body bg-loss/20 text-loss px-2 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
          {/* SA Save button is rendered inside HomepageReviewList as a fixed overlay */}
        </div>
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
                allChannels={channelsByArticle[sub.article_id] || []}
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

          {/* Homepage panel — SA only */}
          {isSA && (
            <div className="border border-brass-400/20 rounded-xl bg-brass-400/5 p-4 mb-4">
              <p className="text-brass-400 text-[10px] font-body uppercase tracking-widest mb-1">
                Discussion Homepage · {homepageArticleIds.size}/10 slots used
              </p>
              <p className="text-paper/40 text-xs font-body">
                SA only — toggle articles using the buttons on each row, then click Save Changes top-right to persist.
              </p>
            </div>
          )}

          <HomepageReviewList
            reviewed={reviewed}
            channelsByArticle={channelsByArticle}
            commentsBySubmission={commentsBySubmission}
            reviewerId={user.id}
            isSA={isSA}
            homepageArticleIds={[...homepageArticleIds]}
          />
        </section>
      )}

      {/* Human Intel Research Queue */}
      <section className="mt-10 pt-8 border-t border-ink-800">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide">Human Intel Research Queue</p>
          <span className="text-xs font-body text-paper/30">{(intelRequests || []).length} total</span>
        </div>
        <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-4 mb-4">
          <p className="text-paper/50 text-xs font-body leading-relaxed">
            Member research questions submitted for human analyst review. <span className="text-blue-400">Accept &amp; claim</span> to lock a request to yourself, then respond when ready. Use <span className="text-orange-400">↩ Follow-up</span> to ask for more context, or <span className="text-loss">✕ Deny</span> if out of scope.
          </p>
        </div>
        <ResearchQueue requests={intelRequests || []} currentUserId={user.id} />
      </section>

    </main>
  );
}
