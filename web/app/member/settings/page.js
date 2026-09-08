import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { signOut } from "../../../lib/auth-actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">Settings</h1>

      <div className="border border-ink-700 rounded-lg bg-ink-900 p-6 mb-6">
        <p className="text-paper/40 text-xs font-body mb-1">Signed in as</p>
        <p className="text-paper/90 font-body">{user.email}</p>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
