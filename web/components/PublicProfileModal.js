"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePublicProfile } from "../lib/profile-actions";
import AvatarPicker from "./AvatarPicker";

export default function PublicProfileModal({ profile, onClose }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [professionalTitle, setProfessionalTitle] = useState(profile.professional_title || "");
  const [tagline, setTagline] = useState(profile.tagline || "");
  const [currentJobRole, setCurrentJobRole] = useState(profile.current_job_role || "");
  const [twitterUrl, setTwitterUrl] = useState(profile.socials?.twitter || "");
  const [githubUrl, setGithubUrl] = useState(profile.socials?.github || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.socials?.website || "");

  function handleSave(e) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await updatePublicProfile({
        displayName,
        bio,
        linkedinUrl,
        professionalTitle,
        tagline,
        currentJobRole,
        socials: {
          ...(twitterUrl.trim() && { twitter: twitterUrl.trim() }),
          ...(githubUrl.trim() && { github: githubUrl.trim() }),
          ...(websiteUrl.trim() && { website: websiteUrl.trim() }),
        },
      });
      if (result?.error) {
        setMessage(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 px-4">
      <div className="bg-ink-900 border border-ink-700 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700 sticky top-0 bg-ink-900">
          <h2 className="font-display text-lg text-paper">Public Profile</h2>
          <button onClick={onClose} className="text-paper/40 hover:text-paper/80 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
          <AvatarPicker currentAvatarUrl={profile.avatar_url} />

          <div>
            <label className="text-paper/40 text-xs font-body uppercase tracking-wide block mb-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
            />
          </div>

          <div>
            <label className="text-paper/40 text-xs font-body uppercase tracking-wide block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A few lines about you"
              className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30 resize-none"
            />
          </div>

          {/* Grouped as "professional info" — what the user described as
              a LinkedIn-style import section (title, tagline, current
              role), filled in manually rather than an actual automated
              LinkedIn API import, which isn't realistically available
              without a LinkedIn partnership agreement. */}
          <div className="border-t border-ink-800 pt-4">
            <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-3">Professional info</p>
            <div className="space-y-3">
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Title (e.g. Senior Research Analyst)"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Tagline (a short one-liner)"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
              <input
                type="text"
                value={currentJobRole}
                onChange={(e) => setCurrentJobRole(e.target.value)}
                placeholder="Current role (e.g. Analyst at Acme Capital)"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
            </div>
          </div>

          <div className="border-t border-ink-800 pt-4">
            <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-3">Links</p>
            <div className="space-y-3">
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="X / Twitter URL"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub URL"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Personal website"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30"
              />
            </div>
          </div>

          {message && <p className="text-loss text-xs font-body">{message}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
