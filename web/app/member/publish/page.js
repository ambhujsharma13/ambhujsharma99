import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ArticleEditor from "../../../components/ArticleEditor";
import ChannelSubmitSelector from "../../../components/ChannelSubmitSelector";

export default async function PublishPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await searchParams;
  let existingArticle = null;
  let isAuthor = false;
  let collaborators = [];

  if (id) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, body, user_id, status, featured_image_url, tags, disclosed_holdings, own_critique")
      .eq("id", id)
      .single();
    existingArticle = data;
    isAuthor = existingArticle?.user_id === user.id;

    if (existingArticle) {
      const { data: collabRows } = await supabase
        .from("article_collaborators")
        .select("user_id, profiles(display_name, email)")
        .eq("article_id", id);
      collaborators = collabRows || [];
    }
  } else {
    isAuthor = true;
  }

  // Fetch all public channels for the submit selector
  const { data: publicChannels } = await supabase
    .from("channels")
    .select("id, name")
    .eq("visibility", "public")
    .order("name");

  // Fetch private channels the user belongs to
  const { data: privateMemberships } = await supabase
    .from("channel_members")
    .select("channel_id, channels(id, name)")
    .eq("user_id", user.id);

  const privateChannels = (privateMemberships || [])
    .map(m => m.channels)
    .filter(Boolean);

  // Check which channels this article has already been submitted to
  let existingSubmissions = [];
  let reviewComments = [];
  if (existingArticle?.id) {
    const { data: subs } = await supabase
      .from("article_channel_submissions")
      .select("id, channel_id, status, channels(name)")
      .eq("article_id", existingArticle.id);
    existingSubmissions = subs || [];

    // Fetch RA comments for the author to read
    const submissionIds = (existingSubmissions).map(s => s.id);
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
        // Pass channel selector data to ArticleEditor so it can show
        // the submit panel after publishing
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
