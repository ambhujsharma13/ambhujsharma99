"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateRoleDefinition,
  createRoleDefinition,
  deleteRoleDefinition,
} from "../lib/role-definition-actions";
import { PERMISSION_KEYS } from "../lib/role-permissions";

function RoleEditor({ role, onSaved }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(role.label);
  const [description, setDescription] = useState(role.description || "");
  const [badgeColor, setBadgeColor] = useState(role.badge_color);
  const [permissions, setPermissions] = useState(role.permissions || {});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function togglePermission(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updateRoleDefinition(role.role_key, { label, description, badgeColor, permissions });
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
        if (onSaved) onSaved();
      }
    });
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wide text-ink-950"
          style={{ backgroundColor: badgeColor }}
        >
          {role.abbreviation}
        </span>
        <span className="text-paper/80 text-sm font-body font-medium">{label}</span>
        <span className="text-paper/30 text-xs font-body ml-auto font-mono">{role.role_key}</span>
        {role.is_system_role && (
          <span className="text-paper/30 text-[10px] font-body border border-ink-700 rounded px-1.5 py-0.5">
            system — key protected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">Label</label>
          <input
            value={label}
            onChange={(e) => { setLabel(e.target.value); setSaved(false); }}
            className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
          />
        </div>
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">
            Badge color (hex)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={badgeColor}
              onChange={(e) => { setBadgeColor(e.target.value); setSaved(false); }}
              className="w-8 h-8 rounded cursor-pointer border border-ink-700 bg-transparent"
            />
            <input
              value={badgeColor}
              onChange={(e) => { setBadgeColor(e.target.value); setSaved(false); }}
              className="flex-1 bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-mono focus:outline-none focus:border-brass-400"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">
          Description (shown on public profile pages)
        </label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
          rows={2}
          className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-body resize-none focus:outline-none focus:border-brass-400"
        />
      </div>

      <div className="mb-4">
        <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-2">Permissions</p>
        <div className="space-y-2">
          {PERMISSION_KEYS.map(({ key, label: permLabel, note }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!permissions[key]}
                onChange={() => togglePermission(key)}
                className="mt-0.5 accent-brass-400 cursor-pointer"
              />
              <div>
                <span className="text-paper/80 text-sm font-body group-hover:text-paper transition-colors">
                  {permLabel}
                </span>
                <p className="text-paper/30 text-xs font-body">{note}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-brass-400 text-ink-950 text-sm font-body font-medium px-4 py-1.5 rounded-md hover:bg-brass-300 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-gain text-sm font-body">Saved</span>}
        {error && <span className="text-loss text-sm font-body">{error}</span>}
      </div>
    </div>
  );
}

function CreateRoleForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [badgeColor, setBadgeColor] = useState("#9CA3AF");
  const [error, setError] = useState("");

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const result = await createRoleDefinition({ roleKey, abbreviation, label, description, badgeColor });
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setRoleKey(""); setAbbreviation(""); setLabel(""); setDescription(""); setBadgeColor("#9CA3AF");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-dashed border-ink-600 rounded-lg w-full py-3 text-paper/40 text-sm font-body hover:border-ink-500 hover:text-paper/60 transition-colors"
      >
        + Add a new role
      </button>
    );
  }

  return (
    <div className="border border-brass-400/30 rounded-lg bg-ink-900 p-4">
      <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-4">New role</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">
            Role key (internal, e.g. community)
          </label>
          <input
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            placeholder="community"
            className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-mono focus:outline-none focus:border-brass-400"
          />
        </div>
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">
            Abbreviation (e.g. CA)
          </label>
          <input
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
            placeholder="CA"
            maxLength={4}
            className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-mono focus:outline-none focus:border-brass-400"
          />
        </div>
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Community Admin"
            className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
          />
        </div>
        <div>
          <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">Badge color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-ink-700 bg-transparent"
            />
            <input
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value)}
              className="flex-1 bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-mono focus:outline-none focus:border-brass-400"
            />
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="text-paper/40 text-[11px] font-body uppercase tracking-wide block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this role do?"
          className="w-full bg-ink-800 border border-ink-700 rounded px-2 py-1.5 text-paper text-sm font-body resize-none focus:outline-none focus:border-brass-400"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="bg-brass-400 text-ink-950 text-sm font-body font-medium px-4 py-1.5 rounded-md hover:bg-brass-300 transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create role"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-paper/40 text-sm font-body hover:text-paper/70"
        >
          Cancel
        </button>
        {error && <span className="text-loss text-sm font-body">{error}</span>}
      </div>
    </div>
  );
}

function DeleteRoleButton({ roleKey, isSystemRole }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (isSystemRole) return null;

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-loss/50 text-xs font-body hover:text-loss transition-colors"
      >
        Delete role
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-paper/50 text-xs font-body">Delete this role?</span>
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await deleteRoleDefinition(roleKey);
            if (result?.error) setError(result.error);
            else router.refresh();
          })
        }
        disabled={isPending}
        className="text-loss text-xs font-body hover:underline disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-paper/40 text-xs font-body hover:text-paper/70">
        Cancel
      </button>
      {error && <span className="text-loss text-xs font-body">{error}</span>}
    </div>
  );
}

export default function RoleConsole({ roleDefinitions }) {
  return (
    <div>
      {(roleDefinitions || []).map((role) => (
        <div key={role.role_key}>
          <RoleEditor role={role} />
          <div className="flex justify-end -mt-2 mb-4 px-1">
            <DeleteRoleButton roleKey={role.role_key} isSystemRole={role.is_system_role} />
          </div>
        </div>
      ))}
      <CreateRoleForm />
    </div>
  );
}
