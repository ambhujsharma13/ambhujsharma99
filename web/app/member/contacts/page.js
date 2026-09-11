import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import AvatarDisplay from "../../../components/AvatarDisplay";
import AddContactForm from "../../../components/AddContactForm";
import RemoveContactButton from "../../../components/RemoveContactButton";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // "Contact list" means anyone in either direction, per explicit
  // request — fetched as two separate queries (rows I added, rows
  // where someone added me) and merged, since a single .or() filter
  // can't easily distinguish "I can remove this one" (only rows where
  // I'm user_id) from "this one just follows me" in the same result
  // shape without extra client-side bookkeeping either way.
  const { data: myAdds } = await supabase
    .from("contacts")
    .select("contact_id, created_at")
    .eq("user_id", user.id);
  const { data: addedMe } = await supabase
    .from("contacts")
    .select("user_id, created_at")
    .eq("contact_id", user.id);

  const myAddIds = new Set((myAdds || []).map((c) => c.contact_id));
  const allOtherIds = new Set([...myAddIds, ...(addedMe || []).map((c) => c.user_id)]);

  let profilesById = {};
  if (allOtherIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, professional_title")
      .in("id", Array.from(allOtherIds));
    profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  const contacts = Array.from(allOtherIds).map((id) => ({
    id,
    profile: profilesById[id],
    canRemove: myAddIds.has(id), // can only remove contacts you added yourself, not people who just added you
  }));

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">My Contacts</h1>

      <AddContactForm />

      <div className="mt-6 space-y-1">
        {contacts.length === 0 ? (
          <p className="text-paper/40 font-body text-sm">No contacts yet — add someone above.</p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-800/40">
              <AvatarDisplay avatarUrl={c.profile?.avatar_url} displayName={c.profile?.display_name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-paper/90 text-sm font-body truncate">{c.profile?.display_name || "Member"}</p>
                {c.profile?.professional_title && (
                  <p className="text-paper/30 text-xs font-body truncate">{c.profile.professional_title}</p>
                )}
              </div>
              <Link
                href={`/member/inbox/${c.id}`}
                className="text-brass-400 text-xs font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors shrink-0"
              >
                Message
              </Link>
              {c.canRemove && <RemoveContactButton contactId={c.id} />}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
