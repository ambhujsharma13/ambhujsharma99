"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { CharacterCount } from "@tiptap/extensions";
import { createClient } from "../lib/supabase/client";
import { saveArticle, deleteArticle } from "../lib/article-actions";

const TITLE_MAX_CHARS = 100;
const FONT_SIZES = ["14px", "16px", "18px", "24px", "32px"];

function Toolbar({ editor }) {
  if (!editor) return null;

  const buttons = [
    { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: "bold", style: "font-bold" },
    { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: "italic", style: "italic" },
    { label: "U", action: () => editor.chain().focus().toggleUnderline().run(), active: "underline", style: "underline" },
    { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: "heading" },
    { label: "•", action: () => editor.chain().focus().toggleBulletList().run(), active: "bulletList" },
    { label: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), active: "orderedList" },
    { label: "❝", action: () => editor.chain().focus().toggleBlockquote().run(), active: "blockquote", title: "Blockquote" },
  ];

  const indentButtons = [
    { label: "←", action: () => editor.chain().focus().liftListItem("listItem").run(), title: "Outdent" },
    { label: "→", action: () => editor.chain().focus().sinkListItem("listItem").run(), title: "Indent" },
  ];

  function handleInsertLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function handleInsertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";

  return (
    <div className="flex items-center gap-1 border-b border-ink-700 px-2 py-1.5 flex-wrap">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.title}
          onClick={b.action}
          className={`px-2.5 py-1 rounded text-sm font-body ${b.style || ""} ${
            editor.isActive(b.active) ? "bg-brass-500 text-ink-950" : "text-paper/70 hover:bg-ink-800"
          }`}
        >
          {b.label}
        </button>
      ))}

      <div className="w-px h-5 bg-ink-700 mx-1" />

      {indentButtons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.title}
          onClick={b.action}
          className="px-2.5 py-1 rounded text-sm font-body text-paper/70 hover:bg-ink-800"
        >
          {b.label}
        </button>
      ))}

      <div className="w-px h-5 bg-ink-700 mx-1" />

      <button
        type="button"
        title="Insert link"
        onClick={handleInsertLink}
        className={`px-2.5 py-1 rounded text-sm font-body ${
          editor.isActive("link") ? "bg-brass-500 text-ink-950" : "text-paper/70 hover:bg-ink-800"
        }`}
      >
        🔗
      </button>

      <button
        type="button"
        title="Insert table"
        onClick={handleInsertTable}
        className="px-2.5 py-1 rounded text-sm font-body text-paper/70 hover:bg-ink-800"
      >
        ⊞
      </button>

      <div className="w-px h-5 bg-ink-700 mx-1" />

      <select
        value={currentFontSize}
        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        className="bg-ink-800 border border-ink-700 rounded px-2 py-1 text-paper/80 text-xs font-body"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ArticleEditor({ articleId = null, initialTitle = "", initialBody = "" }) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [disclosesPosition, setDisclosesPosition] = useState(false);

  const editor = useEditor({
    extensions: [
      // StarterKit now bundles Underline AND Link by default (a TipTap
      // 3.0 change, confirmed via research after a real "Duplicate
      // extension names found: ['underline']" warning appeared) — the
      // bundled Underline needs no configuration, so it's used as-is
      // rather than re-imported separately. Link IS disabled here
      // specifically because it needs custom configuration
      // (openOnClick: false) that the bundled default doesn't have —
      // per TipTap's own docs, the correct pattern is disabling the
      // StarterKit version and supplying your own configured one
      // alongside it, not importing both.
      StarterKit.configure({ link: false }),
      Image,
      Link.configure({ openOnClick: false }),
      // Confirmed via TipTap's own v3 migration guide: all four table
      // packages (Table, TableRow, TableCell, TableHeader) are now
      // consolidated into @tiptap/extension-table with named exports,
      // not the four separate default-export packages the original
      // build assumed — that mismatch is exactly what caused the real
      // "Export default doesn't exist" build error. TableKit is the
      // single bundled extension that replaces all four at once.
      TableKit.configure({ table: { resizable: true } }),
      TextStyle,
      FontSize,
      CharacterCount.configure({ limit: null }),
    ],
    content: initialBody,
    immediatelyRender: false,
  });

  // Word count is purely informational now — no upper limit, per
  // explicit request. Still shown so a writer can see how long their
  // draft has grown, just without any blocking behavior attached.
  const wordCount = editor?.storage.characterCount.words() ?? 0;

  const handleImageUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      if (!file.type.startsWith("image/")) {
        setSaveMessage("Please choose an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage("Images must be under 5MB.");
        return;
      }

      setUploadingImage(true);
      setSaveMessage("");
      const supabase = createClient();
      const filePath = `${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("article-images").upload(filePath, file);
      if (uploadError) {
        setSaveMessage("Image upload failed — please try again.");
        setUploadingImage(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("article-images").getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      setUploadingImage(false);
      event.target.value = "";
    },
    [editor]
  );

  async function handleSave(status) {
    if (!title.trim()) {
      setSaveMessage("Please add a title before saving.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    const result = await saveArticle({
      articleId,
      title: title.trim(),
      body: editor.getHTML(),
      status,
      disclosesPosition,
    });
    setSaving(false);

    if (result?.error) {
      setSaveMessage(result.error);
    } else {
      setSaveMessage(status === "published" ? "Published!" : "Draft saved.");
    }
  }

  async function handleDelete() {
    if (!articleId) return; // nothing saved yet — nothing to delete
    const confirmed = window.confirm("Delete this article permanently? This can't be undone.");
    if (!confirmed) return;

    setSaving(true);
    const result = await deleteArticle(articleId);
    setSaving(false);

    if (result?.error) {
      setSaveMessage(result.error);
    } else {
      window.location.href = "/member/drafts"; // simplest reliable redirect after removing the current article
    }
  }

  if (showPreview) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-paper/40 text-xs font-body uppercase tracking-wide">Preview</span>
          <button
            onClick={() => setShowPreview(false)}
            className="text-brass-400 text-sm font-body hover:underline"
          >
            ← Back to editing
          </button>
        </div>
        <h1 className="font-display text-3xl text-paper mb-2">{title || "Untitled"}</h1>
        {disclosesPosition && (
          <p className="text-paper/40 text-xs font-body italic mb-6">
            The author discloses holding a position related to this article.
          </p>
        )}
        <div
          className="prose prose-invert max-w-none font-body text-paper/90"
          dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_CHARS))}
          placeholder="Article title"
          maxLength={TITLE_MAX_CHARS}
          className="w-full bg-transparent border-b border-ink-700 text-paper font-display text-2xl py-2 focus:outline-none focus:border-brass-400"
        />
        <div className="text-right text-paper/30 text-xs font-body mt-1">
          {title.length}/{TITLE_MAX_CHARS} characters
        </div>
      </div>

      <div className="border border-ink-700 rounded-lg bg-ink-900">
        <Toolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none px-4 py-4 min-h-[300px] font-body text-paper/90 focus:outline-none [&_.ProseMirror]:outline-none"
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-ink-700">
          <label className="text-brass-400 text-xs font-body cursor-pointer hover:text-brass-300">
            {uploadingImage ? "Uploading..." : "+ Add image"}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
          </label>
          <span className="text-xs font-body text-paper/30">{wordCount} words</span>
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 text-paper/60 text-sm font-body cursor-pointer">
        <input
          type="checkbox"
          checked={disclosesPosition}
          onChange={(e) => setDisclosesPosition(e.target.checked)}
          className="accent-brass-400"
        />
        I hold a position related to what this article discusses
      </label>

      {saveMessage && <p className="text-paper/60 text-sm font-body mt-3">{saveMessage}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setShowPreview(true)}
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={saving}
          className="text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50"
        >
          Publish
        </button>
        {articleId && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto text-loss text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
