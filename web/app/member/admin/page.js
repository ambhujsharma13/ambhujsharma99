import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import RoleAssignmentRow from "../../../components/RoleAssignmentRow";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("admin_role")
    .eq("id", user.id)
    .single();

  // Not just hidden from navigation — actually enforced here, since a
  // determined non-admin could otherwise type the URL directly. RLS
  // would also block the actual role-change action itself as a second
  // layer, but redirecting here avoids even showing the page's contents.
  if (callerProfile?.admin_role !== "super_admin") {
    redirect("/member/settings");
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("id, email, display_name, admin_role, member_tier, omega_score")
    .order("signup_number", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Admin — member roles</h1>
      <p className="text-paper/40 font-body text-sm mb-6">
        Assign or remove Technical and Research admin roles. Super Admin itself isn&apos;t
        assignable here — that stays a direct database action.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-4 font-medium">Member</th>
            <th className="py-2 pr-4 font-medium">Tier</th>
            <th className="py-2 pr-4 font-medium text-right">Omega</th>
            <th className="py-2 pr-4 font-medium">Admin role</th>
          </tr>
        </thead>
        <tbody>
          {(members || []).map((member) => (
            <RoleAssignmentRow key={member.id} member={member} />
          ))}
        </tbody>
      </table>
    </main>
  );
}
