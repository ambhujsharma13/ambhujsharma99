import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Bookmarks</h1>
      <p className="text-paper/40 font-body text-sm">
        Coming soon — saving other members&apos; articles and news items for later needs its own
        database table, not yet built.
      </p>
    </main>
  );
}
