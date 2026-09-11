// Shared permission key definitions — kept in a separate, non-server
// file so both the client-side RoleConsole component and the server-
// side role-definition-actions.js can import from here without hitting
// Next.js's rule that "use server" module exports can't be used as
// plain data in client components. PERMISSION_KEYS.map is not a
// function when imported from a "use server" file because Next.js
// serialises server module exports differently — moving constants out
// of the server file into a plain shared module fixes this.
export const PERMISSION_KEYS = [
  {
    key: "create_public_channels",
    label: "Create public channels",
    note: "Enforced today — this is the one real, active permission.",
  },
  {
    key: "pin_posts_in_any_channel",
    label: "Pin posts in any channel",
    note: "Not yet enforced anywhere — defined for a future global-pin feature.",
  },
  {
    key: "moderate_content",
    label: "Moderate content platform-wide",
    note: "Not yet enforced — the moderation queue itself hasn't been built yet.",
  },
  {
    key: "manage_private_channels",
    label: "Manage any private channel",
    note: "Not yet enforced — no cross-channel management UI exists yet.",
  },
];
