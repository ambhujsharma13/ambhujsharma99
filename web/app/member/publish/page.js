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

  if (id) {
    // Loading an existing draft to resume editing (reached from the
    // Saved Drafts list). RLS on the articles table already restricts
    // this to the author or a listed collaborator — a stranger's
    // article id here simply returns no row, not someone else's data.
    const { data } = await supabase.from("articles").select("id, title, body").eq("id", id).single();
    existingArticle = data;
  }

  return (
    <main>
      <ArticleEditor
        articleId={existingArticle?.id ?? null}
        initialTitle={existingArticle?.title ?? ""}
        initialBody={existingArticle?.body ?? ""}
      />
    </main>
  );
}
