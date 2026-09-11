"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PRESET_AVATARS } from "../lib/presetAvatars";
import { updateAvatar } from "../lib/profile-actions";
import AvatarDisplay from "./AvatarDisplay";

export default function AvatarPicker({ currentAvatarUrl }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handlePick(presetId) {
    setMessage("");
    startTransition(async () => {
      const result = await updateAvatar(presetId);
      if (result?.error) {
        setMessage(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Choose an avatar</p>
      <div className="grid grid-cols-4 gap-3">
        {PRESET_AVATARS.map((preset) => {
          const isSelected = currentAvatarUrl === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePick(preset.id)}
              disabled={isPending}
              className={`rounded-full p-0.5 transition-colors disabled:opacity-50 ${
                isSelected ? "ring-2 ring-brass-400" : "ring-1 ring-ink-700 hover:ring-paper/40"
              }`}
              title={`Preset ${preset.id.split("-")[1]}`}
            >
              <AvatarDisplay avatarUrl={preset.id} size={48} />
            </button>
          );
        })}
      </div>
      {message && <p className="text-loss text-xs font-body mt-2">{message}</p>}
      <p className="text-paper/25 text-[11px] font-body mt-2">
        Uploading your own picture is coming in a later update.
      </p>
    </div>
  );
}
