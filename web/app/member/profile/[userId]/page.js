import { notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import AvatarDisplay from "../../../../components/AvatarDisplay";
import AddContactButton from "../../../../components/AddContactButton";
import RoleBadge from "../../../../components/RoleBadge";
import OmegaBadge from "../../../../components/OmegaBadge";

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, status, bio, linkedin_url, professional_title, tagline, current_job_role, socials, admin_role, member_tier, omega_score"
    )
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  // Role definitions for the badge and the full explanation card below
  const { data: roleDefinitions } = await supabase
    .from("admin_role_definitions")
    .select("role_key, abbreviation, label, description, badge_color");

  const roleDef = profile.admin_role
    ? (roleDefinitions || []).find((r) => r.role_key === profile.admin_role)
    : null;

  const isOwnProfile = user?.id === profile.id;

  // Determines which of three states AddContactButton should start in
  // — fetched here (server-side) rather than as a separate client-side
  // check, since this page is already fetching data here anyway.
  let alreadyAdded = false;
  let requestPending = false;
  if (user && !isOwnProfile) {
    const { data: contactRow } = await supabase
      .from("contacts")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("contact_id", profile.id)
      .single();
    alreadyAdded = !!contactRow;

    if (!alreadyAdded) {
      const { data: pendingRow } = await supabase
        .from("pending_requests")
        .select("id")
        .eq("request_type", "contact_invite")
        .eq("invited_by", user.id)
        .eq("invited_user_id", profile.id)
        .eq("status", "pending")
        .single();
      requestPending = !!pendingRow;
    }
  }

  const socials = profile.socials || {};

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <div className="flex items-start gap-4 mb-6">
        <AvatarDisplay avatarUrl={profile.avatar_url} displayName={profile.display_name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl text-paper">{profile.display_name || "Member"}</h1>
            <RoleBadge
              adminRole={profile.admin_role}
              roleDefinitions={roleDefinitions || []}
              size="md"
            />
            <OmegaBadge
              memberTier={profile.member_tier}
              omegaScore={profile.omega_score}
              size="md"
              showScore={true}
            />
          </div>
          {profile.professional_title && (
            <p className="text-paper/60 text-sm font-body mt-1">{profile.professional_title}</p>
          )}
          {profile.tagline && <p className="text-paper/40 text-sm font-body italic mt-0.5">{profile.tagline}</p>}
        </div>
        {!isOwnProfile && user && (
          <AddContactButton contactId={profile.id} initiallyAdded={alreadyAdded} initiallyPending={requestPending} />
        )}
      </div>

      {/* Role card — shown only for members who hold an admin role,
          to give the community context on what that role actually means,
          per explicit request. Not shown to regular members since there's
          nothing meaningful to say about the absence of a role. */}
      {roleDef && (
        <div
          className="border rounded-lg p-4 mb-4"
          style={{ borderColor: `${roleDef.badge_color}40`, backgroundColor: `${roleDef.badge_color}10` }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wide text-ink-950"
              style={{ backgroundColor: roleDef.badge_color }}
            >
              {roleDef.abbreviation}
            </span>
            <span className="text-paper/80 text-sm font-body font-medium">{roleDef.label}</span>
          </div>
          {roleDef.description && (
            <p className="text-paper/60 text-sm font-body">{roleDef.description}</p>
          )}
        </div>
      )}

      {profile.bio && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
          <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Bio</p>
          <p className="text-paper/80 font-body text-sm whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      {profile.current_job_role && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
          <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Current role</p>
          <p className="text-paper/80 font-body text-sm">{profile.current_job_role}</p>
        </div>
      )}

      {(profile.linkedin_url || socials.twitter || socials.github || socials.website) && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
          <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Links</p>
          <div className="flex flex-col gap-1.5">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brass-400 text-sm font-body hover:underline">
                LinkedIn
              </a>
            )}
            {socials.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-brass-400 text-sm font-body hover:underline">
                X / Twitter
              </a>
            )}
            {socials.github && (
              <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-brass-400 text-sm font-body hover:underline">
                GitHub
              </a>
            )}
            {socials.website && (
              <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-brass-400 text-sm font-body hover:underline">
                Website
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
