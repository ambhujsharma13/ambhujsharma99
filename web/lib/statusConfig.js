// Manually-set status, per explicit request — NOT automatic online/away
// detection (that would need real-time presence infrastructure, already
// scoped separately and deferred to Phase 2 for Contacts and Inbox).
// "Available" is the fixed default the moment someone signs in; every
// other state is something the person sets themselves, the same way
// Discord's own status works.
export const STATUS_OPTIONS = [
  { value: "available", label: "Available", dotClass: "bg-gain" },
  { value: "away", label: "Away", dotClass: "bg-yellow-400" },
  { value: "dnd", label: "Do Not Disturb", dotClass: "bg-loss" },
  { value: "invisible", label: "Invisible", dotClass: "bg-paper/30" },
];

export function getStatusConfig(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}
