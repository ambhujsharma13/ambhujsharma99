"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createChannel } from "../lib/channel-actions";

function CreateChannelForm({ visibility }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createChannel(name, description, visibility);
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
        setDescription("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-6">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-3">
        Create a {visibility} channel
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={
          visibility === "private" ? "e.g. Value Investing Mastermind" : "e.g. Semiconductor Deep Dives"
        }
        className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body mb-2 focus:outline-none focus:border-brass-400"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body mb-3 focus:outline-none focus:border-brass-400"
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50"
      >
        Create channel
      </button>
      {error && <p className="text-loss text-xs font-body mt-2">{error}</p>}
    </form>
  );
}

export default function ChannelList({ visibility, channels }) {
  return (
    <div>
      <CreateChannelForm visibility={visibility} />

      {channels.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">
          No {visibility} channels yet — create the first one above.
        </p>
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/member/channels/${channel.id}`}
              className="block border border-ink-700 rounded-lg bg-ink-900 p-4 hover:bg-ink-800/60 transition-colors"
            >
              <p className="text-paper font-body font-medium">{channel.name}</p>
              {channel.description && (
                <p className="text-paper/40 text-sm font-body mt-1">{channel.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
