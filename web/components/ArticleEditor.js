"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { CharacterCount } from "@tiptap/extensions";
import { createClient } from "../lib/supabase/client";
import { saveArticle } from "../lib/article-actions";

const TITLE_MAX_CHARS = 60;
const BODY_MAX_WORDS = 2000;

function Toolbar({ editor }) {
  if (!editor) return null;

  const buttons = [
    { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: "bold", style: "font-bold" },
    { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: "italic", style: "italic" },
    { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: "heading" },
    { label: "•", action: () => editor.chain().focus().toggleBulletList().run(), active: "bulletList" },
    { label: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), active: "orderedList" },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-ink-700 px-2 py-1.5">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.action}
          className={`px-2.5 py-1 rounded text-sm font-body ${b.style || ""} ${
            editor.isActive(b.active) ? "bg-brass-500 text-ink-950" : "text-paper/70 hover:bg-ink-800"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

export default function ArticleEditor({ articleId = null, initialTitle = "", initialBody = "" }) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      CharacterCount.configure({ limit: null }), // display-only — enforce the word cap ourselves so we can show a clear message, rather than silently blocking further typing
    ],
    content: initialBody,
    immediatelyRender: false, // avoids a Next.js SSR hydration mismatch warning specific to TipTap
  });

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const overWordLimit = wordCount > BODY_MAX_WORDS;

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
      event.target.value = ""; // allows re-selecting the same file again later
    },
    [editor]
  );

  async function handleSave(status) {
    if (!title.trim()) {
      setSaveMessage("Please add a title before saving.");
      return;
    }
    if (overWordLimit) {
      setSaveMessage(`Body is over the ${BODY_MAX_WORDS}-word limit — please trim it before saving.`);
      return;
    }

    setSaving(true);
    setSaveMessage("");
    const result = await saveArticle({
      articleId,
      title: title.trim(),
      body: editor.getHTML(),
      status,
    });
    setSaving(false);

    if (result?.error) {
      setSaveMessage(result.error);
    } else {
      setSaveMessage(status === "published" ? "Published!" : "Draft saved.");
    }
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
          <span className={`text-xs font-body ${overWordLimit ? "text-loss" : "text-paper/30"}`}>
            {wordCount}/{BODY_MAX_WORDS} words
          </span>
        </div>
      </div>

      {saveMessage && <p className="text-paper/60 text-sm font-body mt-3">{saveMessage}</p>}

      <div className="flex items-center gap-3 mt-4">
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
      </div>
    </div>
  );
}
