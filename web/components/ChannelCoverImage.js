"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { updateChannelCoverImage } from "../lib/channel-actions";

export default function ChannelCoverImage({ channelId, coverImageUrl, isChannelAdmin }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be under 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    const supabase = createClient();
    const filePath = `channel-cover-${channelId}-${crypto.randomUUID()}-${file.name}`;

    // Reuses the existing article-images bucket rather than a new one
    // — it's already set up with public read + authenticated write
    // policies, and there's nothing article-specific about those rules
    // that would need a separate bucket for channel covers.
    const { error: uploadError } = await supabase.storage.from("article-images").upload(filePath, file);
    if (uploadError) {
      setError("Upload failed — please try again.");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("article-images").getPublicUrl(filePath);

    const result = await updateChannelCoverImage(channelId, publicUrl);
    setUploading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    event.target.value = "";
  }

  if (!coverImageUrl && !isChannelAdmin) {
    return null; // nothing to show, and this viewer can't add one anyway
  }

  return (
    <div className="mb-4">
      {coverImageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImageUrl} alt="" className="w-full rounded-lg max-h-56 object-cover" />
          {isChannelAdmin && (
            <label className="absolute top-2 right-2 bg-ink-950/80 text-paper text-xs font-body rounded-md px-2 py-1 hover:bg-ink-950 cursor-pointer">
              {uploading ? "Uploading..." : "Change"}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>
      ) : (
        <label className="flex items-center justify-center border border-dashed border-ink-700 rounded-lg py-6 text-paper/40 text-sm font-body cursor-pointer hover:border-brass-400 hover:text-brass-400 transition-colors">
          {uploading ? "Uploading..." : "+ Add a cover image"}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      )}
      {error && <p className="text-loss text-xs font-body mt-1">{error}</p>}
    </div>
  );
}
