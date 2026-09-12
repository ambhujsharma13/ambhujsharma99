"use server";

import { createClient } from "./supabase/server";

// File restrictions enforced here (server-side) regardless of what the
// client sends — the client-side checks are UX, these are the real gates.
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp",
  // Documents
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",     // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",   // .docx
  "text/csv",
  "text/plain",
  "application/json",
  // Data/notebook formats
  "text/markdown",
  "application/x-ipynb+json",  // Jupyter notebooks
]);

const MAX_SIZE_BY_TYPE = {
  // Images — 5MB
  "image/jpeg": 5 * 1024 * 1024,
  "image/png":  5 * 1024 * 1024,
  "image/gif":  5 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
  // Documents — 25MB
  "application/pdf": 25 * 1024 * 1024,
  "application/vnd.ms-excel": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 25 * 1024 * 1024,
  "application/vnd.ms-powerpoint": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": 25 * 1024 * 1024,
  "application/msword": 25 * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024,
  // Text/data — 10MB
  "text/csv": 10 * 1024 * 1024,
  "text/plain": 10 * 1024 * 1024,
  "application/json": 10 * 1024 * 1024,
  "text/markdown": 10 * 1024 * 1024,
  "application/x-ipynb+json": 10 * 1024 * 1024,
};

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/csv": "csv",
  "text/plain": "txt",
  "application/json": "json",
  "text/markdown": "md",
  "application/x-ipynb+json": "ipynb",
};

function attachmentType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (["application/vnd.ms-excel",
       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
       "text/csv"].includes(mimeType)) return "spreadsheet";
  if (["application/vnd.ms-powerpoint",
       "application/vnd.openxmlformats-officedocument.presentationml.presentation"].includes(mimeType)) return "presentation";
  if (["application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mimeType)) return "document";
  return "file";
}

export async function uploadAttachment(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("file");
  if (!file || typeof file === "string") return { error: "No file provided." };

  // Type gate
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: `File type not allowed. Accepted: images (JPEG, PNG, GIF, WebP), PDF, Excel (.xlsx/.xls), PowerPoint (.pptx), Word (.docx), CSV, JSON, plain text, and Markdown.` };
  }

  // Size gate
  const maxBytes = MAX_SIZE_BY_TYPE[file.type] ?? 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    const maxMB = maxBytes / 1024 / 1024;
    return { error: `File too large. Maximum: ${maxMB}MB for this file type.` };
  }

  // Derive extension from MIME — never trust the original filename extension
  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Upload failed — please try again." };

  const { data: { publicUrl } } = supabase.storage
    .from("attachments")
    .getPublicUrl(path);

  return {
    url: publicUrl,
    type: attachmentType(file.type),
    name: file.name,
    size: file.size,
  };
}
