import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { signOut } from "../../lib/auth-actions";

// Deliberately minimal — just enough to confirm the full sign-in loop
// actually works end to end (Google → Supabase → session → landing
// here) before building out the real left-pane UI (discussions,
// watchlist, account settings, publish) described for this area.
export default async function MemberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.js should already redirect signed-out visitors away from
  // here, but checking again directly in the page is a reasonable
  // second line of defense rather than trusting middleware alone.
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="font-display text-2xl text-paper mb-2">You&apos;re signed in</h1>
      <p className="text-paper/50 font-body mb-1">{user.email}</p>
      <p className="text-paper/30 font-body text-sm mb-8">
        This is a placeholder — the real member area (watchlist, discussions, publishing) is coming next.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="text-brass-400 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
