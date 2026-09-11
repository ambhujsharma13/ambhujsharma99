// A fixed set of predefined avatars, per explicit request ("predefined
// images / vector images / avatars to choose from initially" — actual
// upload-your-own comes later). Deliberately abstract/geometric rather
// than cartoon faces, to match this app's professional financial-data
// tone rather than a casual chat-app aesthetic.
//
// Colors are hardcoded hex values via inline style, NOT Tailwind
// fill-*/stroke-* utility classes — confirmed via live testing that
// those utilities weren't actually generating any CSS for this
// project's custom color names (fill-brass-400 etc. rendered every
// shape as solid black), even though bg-*/text-* variants of the same
// color names work correctly everywhere else in the app. These hex
// values are chosen to approximate the same palette (brass/gold accent,
// dark ink background, cream paper text, green/red gain/loss) rather
// than pull the exact values, since those aren't available outside the
// app's own build.
//
// Stored as a simple id string (e.g. "preset-1") in profiles.avatar_url
// — the same column Google SSO already populates with an actual image
// URL on signup. AvatarDisplay.js is what decides whether a given
// avatar_url value is one of these preset ids or a real URL.
const BRASS = "#D4A44C";
const BRASS_LIGHT = "#E0BC73";
const INK_DARK = "#14141C";
const INK_MED = "#1E1E29";
const PAPER = "#E8E4D9";
const GAIN = "#4ADE80";
const LOSS = "#F87171";

export const PRESET_AVATARS = [
  { id: "preset-1", render: () => (
    <>
      <circle cx="12" cy="12" r="12" style={{ fill: BRASS }} />
      <circle cx="12" cy="12" r="5" style={{ fill: INK_DARK }} />
    </>
  )},
  { id: "preset-2", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: INK_MED }} />
      <path d="M0 24 L24 0 L24 24 Z" style={{ fill: BRASS }} />
    </>
  )},
  { id: "preset-3", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: BRASS_LIGHT }} />
      <circle cx="8" cy="8" r="5" style={{ fill: INK_DARK }} />
      <circle cx="17" cy="17" r="5" style={{ fill: INK_DARK }} />
    </>
  )},
  { id: "preset-4", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: INK_MED }} />
      <rect x="4" y="4" width="16" height="16" style={{ fill: PAPER }} />
      <rect x="8" y="8" width="8" height="8" style={{ fill: INK_MED }} />
    </>
  )},
  { id: "preset-5", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: LOSS }} />
      <polygon points="12,3 21,20 3,20" style={{ fill: INK_DARK }} />
    </>
  )},
  { id: "preset-6", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: GAIN }} />
      <circle cx="12" cy="12" r="8" style={{ fill: INK_DARK }} />
      <circle cx="12" cy="12" r="3" style={{ fill: GAIN }} />
    </>
  )},
  { id: "preset-7", render: () => (
    <>
      <rect width="24" height="24" style={{ fill: INK_DARK }} />
      <line x1="0" y1="6" x2="24" y2="6" style={{ stroke: BRASS }} strokeWidth="3" />
      <line x1="0" y1="14" x2="24" y2="14" style={{ stroke: BRASS_LIGHT }} strokeWidth="3" />
      <line x1="0" y1="21" x2="24" y2="21" style={{ stroke: PAPER, opacity: 0.4 }} strokeWidth="2" />
    </>
  )},
  { id: "preset-8", render: () => (
    <>
      <circle cx="12" cy="12" r="12" style={{ fill: INK_MED }} />
      <polygon points="12,4 20,18 4,18" style={{ fill: BRASS_LIGHT }} />
    </>
  )},
];

export function getPresetAvatar(id) {
  return PRESET_AVATARS.find((a) => a.id === id) || null;
}
