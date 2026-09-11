import { getPresetAvatar } from "../lib/presetAvatars";

// Three possible states for avatar_url, checked in order: a known
// preset id (renders the matching inline SVG), an actual URL (e.g.
// Google SSO's photo, still populated there by default until someone
// picks a preset instead — renders as a real <img>), or nothing at all
// (renders the first letter of the display name in a plain colored
// circle, so there's always something reasonable to show).
export default function AvatarDisplay({ avatarUrl, displayName, size = 32, className = "" }) {
  const preset = avatarUrl ? getPresetAvatar(avatarUrl) : null;

  if (preset) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`rounded-full ${className}`}
        aria-hidden="true"
      >
        {preset.render()}
      </svg>
    );
  }

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = (displayName || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`rounded-full bg-ink-800 text-paper/60 flex items-center justify-center font-body font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
