import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import RoleAssignmentRow from "../../../components/RoleAssignmentRow";
import ChannelList from "../../../components/ChannelList";
import RoleConsole from "../../../components/RoleConsole";

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

  if (callerProfile?.admin_role !== "super_admin") {
    redirect("/member/settings");
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("id, email, display_name, admin_role, member_tier, omega_score")
    .order("signup_number", { ascending: true });

  const { data: publicChannels } = await supabase
    .from("channels")
    .select("id, name, description")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  // Fetched here so both RoleAssignmentRow (which builds the dropdown
  // dynamically from this list) and RoleConsole (the editor itself)
  // share the same data rather than each fetching their own copy.
  const { data: roleDefinitions } = await supabase
    .from("admin_role_definitions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Admin Console</h1>
      <p className="text-paper/40 font-body text-sm mb-8">
        Assign member roles, manage public channels, and edit role definitions.
        Super Admin itself isn&apos;t assignable here — that stays a direct database action.
      </p>

      <h2 className="font-display text-lg text-paper mb-2">Member Roles</h2>
      <p className="text-paper/40 font-body text-sm mb-4">
        Assign or remove roles from members. The dropdown reflects the current live role definitions below.
      </p>
      <table className="w-full text-sm mb-10">
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
            <RoleAssignmentRow key={member.id} member={member} roleDefinitions={roleDefinitions || []} />
          ))}
        </tbody>
      </table>

      <h2 className="font-display text-lg text-paper mb-2">Role Definitions</h2>
      <p className="text-paper/40 font-body text-sm mb-4">
        Edit the label, description, badge color, and permissions for each role. Changes take effect
        immediately across badges on posts, profiles, and the toolbar. The Super Admin role&apos;s key
        is protected from deletion — everything else (including adding new roles entirely) is
        editable here.
      </p>
      <RoleConsole roleDefinitions={roleDefinitions || []} />

      <h2 className="font-display text-lg text-paper mb-2 mt-10">Public Channels</h2>
      <p className="text-paper/40 font-body text-sm mb-4">
        Only roles with the &quot;Create public channels&quot; permission can create these — enforced at the
        database level, not just hidden from members.
      </p>
      <ChannelList visibility="public" channels={publicChannels || []} />
    </main>
  );
}
