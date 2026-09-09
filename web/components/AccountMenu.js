"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "../lib/auth-actions";

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-brass-400 hover:text-brass-300 font-medium text-sm font-body"
      >
        My Account
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-ink-900 border border-ink-700 rounded-md shadow-2xl py-1 z-50">
          <Link
            href="/member/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm font-body text-paper/80 hover:bg-ink-800"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm font-body text-paper/80 hover:bg-ink-800"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
