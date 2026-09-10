import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ArticleEditor from "../../../components/ArticleEditor";

export default async function PublishPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.js already redirects signed-out visitors away from here, but
  // checking again directly in the page is a reasonable second line of
  // defense rather than trusting middleware alone.
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await searchParams;
  let existingArticle = null;
  let isAuthor = false;
  let collaborators = [];

  if (id) {
    // Loading an existing draft to resume editing (reached from the
    // Saved Drafts list). RLS on the articles table already restricts
    // this to the author or a listed collaborator — a stranger's
    // article id here simply returns no row, not someone else's data.
    //
    // Confirmed real bug: this select only ever fetched id/title/body —
    // featured_image_url, tags, disclosed_holdings, and own_critique
    // were never loaded here at all, so every time an existing article
    // was reopened, those four fields silently reset to empty in the
    // editor even though the correct values were still safely stored in
    // the database the whole time. Not data loss, just never displayed.
    const { data } = await supabase
      .from("articles")
      .select("id, title, body, user_id, featured_image_url, tags, disclosed_holdings, own_critique")
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
    isAuthor = true; // a brand-new, not-yet-saved article has no collaborators to manage yet, but its eventual author is whoever creates it
  }

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
      />
    </main>
  );
}
