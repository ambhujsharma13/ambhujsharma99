"use client";

import { useRef, useState } from "react";
import { uploadAttachment } from "../lib/attachment-actions";

// File type limits — mirrors attachment-actions.js but shown in UI
const ACCEPT = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv", "text/plain", "application/json", "text/markdown",
].join(",");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(type) {
  if (!type) return "📎";
  if (type === "image") return "🖼️";
  if (type === "pdf") return "📄";
  if (type === "spreadsheet") return "📊";
  if (type === "presentation") return "📽️";
  if (type === "document") return "📝";
  return "📎";
}

// Icons for the toolbar buttons
const ImageIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <circle cx="7" cy="8.5" r="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 14l4-4 3 3 3-3 4 4" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2v5h5" />
  </svg>
);

// AttachmentComposer renders the toolbar row and attachment preview.
// Parent controls content textarea — this component only handles file
// picking, uploading, and passing the attachment object back via onAttach.
export default function AttachmentComposer({ onAttach, attachment, onClear, disabled }) {
  const imageInputRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadAttachment(fd);
    setUploading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onAttach(result);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-1">
        {/* Image picker */}
        <button
          type="button"
          title="Attach image (JPEG, PNG, GIF, WebP — max 5MB)"
          disabled={disabled || uploading}
          onClick={() => imageInputRef.current?.click()}
          className="text-paper/30 hover:text-brass-400 transition-colors disabled:opacity-30 p-1 rounded"
        >
          <ImageIcon />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFile}
        />

        {/* Document / file picker */}
        <button
          type="button"
          title="Attach file (PDF, Excel, Word, PowerPoint, CSV, JSON — max 25MB)"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-paper/30 hover:text-brass-400 transition-colors disabled:opacity-30 p-1 rounded"
        >
          <FileIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain,application/json,text/markdown"
          className="hidden"
          onChange={handleFile}
        />

        {uploading && (
          <span className="text-paper/40 text-xs font-body ml-1">Uploading…</span>
        )}
        {error && (
          <span className="text-loss text-xs font-body ml-1">{error}</span>
        )}
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="mt-1.5 flex items-center gap-2 bg-ink-800 rounded-md px-2.5 py-1.5 text-xs font-body">
          <span>{fileIcon(attachment.type)}</span>
          {attachment.type === "image" ? (
            <img src={attachment.url} alt={attachment.name} className="h-8 rounded object-cover" />
          ) : null}
          <span className="text-paper/70 truncate max-w-[200px]">{attachment.name}</span>
          <span className="text-paper/30">{formatBytes(attachment.size)}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-paper/30 hover:text-loss ml-auto shrink-0"
            title="Remove attachment"
          >✕</button>
        </div>
      )}
    </div>
  );
}
