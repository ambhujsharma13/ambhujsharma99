"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import AvatarDisplay from "./AvatarDisplay";
import PublicProfileModal from "./PublicProfileModal";
import { updateStatus } from "../lib/profile-actions";
import { STATUS_OPTIONS, getStatusConfig } from "../lib/statusConfig";

export default function UserPanel({ profile }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!profile) return null;

  const currentStatus = getStatusConfig(profile.status);

  function handleStatusPick(value) {
    setMenuOpen(false);
    startTransition(async () => {
      await updateStatus(value);
      router.refresh();
    });
  }

  return (
    <div ref={containerRef} className="relative px-2 pb-2">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-ink-800/60 transition-colors"
      >
        <div className="relative shrink-0">
          <AvatarDisplay avatarUrl={profile.avatar_url} displayName={profile.display_name} size={28} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-ink-900 ${currentStatus.dotClass}`}
            title={currentStatus.label}
          />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-paper/90 text-sm font-body truncate">{profile.display_name || "Member"}</p>
          <p className="text-paper/30 text-[11px] font-body truncate">{currentStatus.label}</p>
        </div>
      </button>

      {menuOpen && (
        <div className="absolute bottom-full left-2 mb-1 w-52 bg-ink-800 border border-ink-700 rounded-lg shadow-lg overflow-hidden z-50">
          <button
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(true);
            }}
            className="w-full text-left px-3 py-2 text-sm font-body text-paper/80 hover:bg-ink-700 transition-colors"
          >
            Public Profile
          </button>
          <div className="border-t border-ink-700" />
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusPick(opt.value)}
              disabled={isPending}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm font-body text-paper/80 hover:bg-ink-700 transition-colors disabled:opacity-50"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
              {opt.label}
              {profile.status === opt.value && <span className="ml-auto text-brass-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}

      {profileOpen && <PublicProfileModal profile={profile} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
