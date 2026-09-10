"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { CharacterCount } from "@tiptap/extensions";
import { createClient } from "../lib/supabase/client";
import { saveArticle, deleteArticle } from "../lib/article-actions";
import CollaboratorManager from "./CollaboratorManager";

const TITLE_MAX_CHARS = 100;
const FONT_SIZES = ["14px", "16px", "18px", "24px", "32px"];
const AUTOSAVE_INTERVAL_MS = 30000;
const READING_WPM = 200; // standard average adult reading speed, used for the estimate display only

// Confirmed real bug via a live Supabase error: "Invalid key" when a
// raw filename (containing spaces, colons, etc. — e.g. a default macOS
// screenshot name like "Screenshot 2026-09-05 at 9.54.54 PM.png") gets
// embedded directly into a Supabase Storage path. The UUID prefix
// already guarantees uniqueness on its own, so the fix is to drop the
// original filename from the storage key entirely rather than trying
// to sanitize every possible character Storage might reject — keeping
// only a cleaned-up extension, which is all that's actually needed.
function safeStorageFileName(prefix, originalName) {
  const rawExtension = originalName.includes(".") ? originalName.split(".").pop() : "";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  return `${prefix}${crypto.randomUUID()}.${extension}`;
}

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
    if (url === null) return;
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

function TagInput({ tags, onChange }) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const clean = draft.trim();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Topic tags</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-ink-800 text-paper/70 text-xs font-body rounded-full px-3 py-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-paper/40 hover:text-loss"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="Type a tag and press Enter (e.g. Semiconductors, Macro, Earnings)"
        className="w-full bg-transparent text-paper text-sm font-body focus:outline-none placeholder:text-paper/30"
      />
    </div>
  );
}

export default function ArticleEditor({
  articleId: initialArticleId = null,
  initialTitle = "",
  initialBody = "",
  initialFeaturedImageUrl = null,
  initialTags = [],
  initialDisclosedHoldings = "",
  initialOwnCritique = "",
  isAuthor = true,
  collaborators = [],
}) {
  const [articleId, setArticleId] = useState(initialArticleId);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [disclosedHoldings, setDisclosedHoldings] = useState(initialDisclosedHoldings);
  const [ownCritique, setOwnCritique] = useState(initialOwnCritique);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialFeaturedImageUrl);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [tags, setTags] = useState(initialTags);
  const [lastAutosaveAt, setLastAutosaveAt] = useState(null);

  // Tracks whether anything has changed since the last save (manual or
  // auto) — autosave only fires when this is true, so it's not silently
  // re-saving identical content every 30 seconds.
  const isDirtyRef = useRef(false);
  const savedSnapshotRef = useRef({ title: initialTitle, body: initialBody });

  // Confirmed necessary after real testing surfaced a genuine bug: the
  // word count display was permanently stuck at 0 regardless of how
  // much was typed. Root cause — wordCount was computed inline from
  // editor.storage on every render, but onUpdate only wrote to a ref
  // (isDirtyRef), which deliberately does NOT trigger a re-render by
  // design. With nothing else causing the component to re-render as
  // the editor's own internal content changed, the inline computation
  // never actually re-ran after the very first render. This counter
  // exists solely to force that re-render on every edit.
  const [, forceRerender] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Image,
      Link.configure({ openOnClick: false }),
      TableKit.configure({ table: { resizable: true } }),
      TextStyle,
      FontSize,
      CharacterCount.configure({ limit: null }),
    ],
    content: initialBody,
    immediatelyRender: false,
    onUpdate: () => {
      isDirtyRef.current = true;
      forceRerender((n) => n + 1);
    },
  });

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / READING_WPM));

  // A starting structure derived from a real, effective post pattern
  // seen in an active crypto-exchange community: intro paragraph +
  // emoji-bulleted key-metrics snapshot + closing insight. Offered as
  // an optional starting point, not a requirement — only shown when
  // the body is still empty, so it can't accidentally overwrite work
  // already in progress.
  function handleUseTemplate() {
    editor?.commands.setContent(`
      <p>Quick rundown on [ticker/topic] as of today.</p>
      <h2>Key Metrics Snapshot</h2>
      <ul>
        <li>📉 [Metric one] — [what changed and why it matters]</li>
        <li>📈 [Metric two] — [what changed and why it matters]</li>
        <li>🎯 [Key level or threshold worth watching]</li>
      </ul>
      <p>[Closing insight — what this means going forward, or what you're watching for next.]</p>
    `);
    isDirtyRef.current = true;
  }

  useEffect(() => {
    if (title !== savedSnapshotRef.current.title) isDirtyRef.current = true;
  }, [title]);

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
      const filePath = safeStorageFileName("", file.name);

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

  async function handleFeaturedImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage("Images must be under 5MB.");
      return;
    }

    setUploadingFeaturedImage(true);
    setSaveMessage("");
    const supabase = createClient();
    const filePath = safeStorageFileName("featured-", file.name);

    const { error: uploadError } = await supabase.storage.from("article-images").upload(filePath, file);
    if (uploadError) {
      // Logged so the actual Supabase error is visible in the browser
      // console — the generic message alone doesn't say whether this
      // is a missing bucket, a storage policy rejection, a duplicate
      // path, or something else entirely.
      console.error("Featured image upload failed:", uploadError);
      setSaveMessage(`Featured image upload failed: ${uploadError.message || "please try again."}`);
      setUploadingFeaturedImage(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("article-images").getPublicUrl(filePath);

    setFeaturedImageUrl(publicUrl);
    isDirtyRef.current = true;
    setUploadingFeaturedImage(false);
    event.target.value = "";
  }

  const performSave = useCallback(
    async (status, { silent = false } = {}) => {
      // Confirmed real bug (found via the user's own bug-report article,
      // written as an article body while testing): this used to just
      // `return` here with zero feedback when the title was empty,
      // matching exactly what was reported — "not getting published
      // without showing any error... just returning to same page and
      // contents." Silent autosave attempts should stay silent (no
      // error needed, it'll just try again once there's a title), but
      // an explicit user click on Save/Publish needs to say why nothing
      // happened.
      if (!title.trim()) {
        if (!silent) setSaveMessage("Please add a title before saving.");
        return;
      }
      if (!editor) {
        if (!silent) setSaveMessage("Editor isn't ready yet — please try again in a moment.");
        return;
      }

      if (!silent) {
        setSaving(true);
        setSaveMessage("");
      }

      const currentBody = editor.getHTML();
      const result = await saveArticle({
        articleId,
        title: title.trim(),
        body: currentBody,
        status,
        disclosedHoldings,
        ownCritique,
        featuredImageUrl,
        tags,
      });

      if (!silent) setSaving(false);

      if (result?.error) {
        if (!silent) setSaveMessage(result.error);
        return;
      }

      if (!articleId && result.articleId) {
        setArticleId(result.articleId); // first save of a brand-new article — capture its new id so autosave/delete can target it going forward
      }
      savedSnapshotRef.current = { title: title.trim(), body: currentBody };
      isDirtyRef.current = false;

      if (silent) {
        setLastAutosaveAt(new Date());
      } else {
        setSaveMessage(status === "published" ? "Published!" : "Draft saved.");
      }
    },
    [articleId, title, editor, disclosedHoldings, ownCritique, featuredImageUrl, tags]
  );

  // Autosave — only fires if there's an actual title to save (matching
  // the same minimum requirement as a manual save) and something has
  // genuinely changed since the last save, checked every 30s rather than
  // on every keystroke.
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current && title.trim() && editor) {
        performSave("draft", { silent: true });
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [performSave, title, editor]);

  async function handleDelete() {
    if (!articleId) return;
    const confirmed = window.confirm("Delete this article permanently? This can't be undone.");
    if (!confirmed) return;

    setSaving(true);
    const result = await deleteArticle(articleId);
    setSaving(false);

    if (result?.error) {
      setSaveMessage(result.error);
    } else {
      window.location.href = "/member/drafts";
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
        {featuredImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={featuredImageUrl} alt="" className="w-full rounded-lg mb-6 max-h-80 object-cover" />
        )}
        <h1 className="font-display text-3xl text-paper mb-2">{title || "Untitled"}</h1>
        <p className="text-paper/40 text-xs font-body mb-2">
          {wordCount} words · ~{readingMinutes} min read
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span key={tag} className="bg-ink-800 text-paper/60 text-xs font-body rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}
        {disclosedHoldings.trim() && (
          <p className="text-paper/40 text-xs font-body italic mb-2">
            Disclosed holdings: {disclosedHoldings}
          </p>
        )}
        <div
          className="prose prose-invert max-w-none font-body text-paper/90"
          dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
        />
        {ownCritique.trim() && (
          <div className="mt-8 pt-6 border-t border-ink-700">
            <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
              Author&apos;s own critique / risks
            </p>
            <p className="text-paper/70 font-body whitespace-pre-wrap">{ownCritique}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex gap-6 items-start">
      <div className="flex-1 min-w-0">
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_CHARS))}
          placeholder="Article title"
          maxLength={TITLE_MAX_CHARS}
          className="w-full bg-transparent border-b border-ink-700 text-paper font-display text-2xl py-2 focus:outline-none focus:border-brass-400"
        />
        <div className="flex items-center justify-between text-xs font-body mt-1">
          <span className="text-paper/30">
            {lastAutosaveAt
              ? `Autosaved ${lastAutosaveAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </span>
          <span className="text-paper/30">
            {title.length}/{TITLE_MAX_CHARS} characters
          </span>
        </div>
      </div>

      <div className="mb-4">
        {featuredImageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredImageUrl} alt="" className="w-full rounded-lg max-h-56 object-cover" />
            <button
              onClick={() => {
                setFeaturedImageUrl(null);
                isDirtyRef.current = true;
              }}
              className="absolute top-2 right-2 bg-ink-950/80 text-paper text-xs font-body rounded-md px-2 py-1 hover:bg-ink-950"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center border border-dashed border-ink-700 rounded-lg py-6 text-paper/40 text-sm font-body cursor-pointer hover:border-brass-400 hover:text-brass-400 transition-colors">
            {uploadingFeaturedImage ? "Uploading..." : "+ Add a featured image (shown in article listings)"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageUpload}
              disabled={uploadingFeaturedImage}
              className="hidden"
            />
          </label>
        )}
      </div>

      {editor?.isEmpty && (
        <button
          onClick={handleUseTemplate}
          className="text-brass-400 text-xs font-body border border-ink-700 rounded-md px-3 py-1.5 mb-2 hover:bg-ink-800 transition-colors"
        >
          Start from a market-update template
        </button>
      )}

      <div className="border border-ink-700 rounded-lg bg-ink-900">
        <Toolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none px-4 py-4 h-[400px] overflow-y-auto font-body text-paper/90 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full"
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-ink-700">
          <label className="text-brass-400 text-xs font-body cursor-pointer hover:text-brass-300">
            {uploadingImage ? "Uploading..." : "+ Add image"}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
          </label>
          <span className="text-xs font-body text-paper/30">
            {wordCount} words · ~{readingMinutes} min read
          </span>
        </div>
      </div>

      <div className="mt-4">
        <TagInput tags={tags} onChange={(next) => { setTags(next); isDirtyRef.current = true; }} />
      </div>

      <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mt-4">
        <label className="text-paper/40 text-xs font-body uppercase tracking-wide block mb-2">
          Disclosed holdings
        </label>
        <textarea
          value={disclosedHoldings}
          onChange={(e) => {
            setDisclosedHoldings(e.target.value);
            isDirtyRef.current = true;
          }}
          placeholder="List any stocks or investments you own that relate to this article (e.g. AAPL, TSLA) — leave blank if none"
          rows={2}
          className="w-full bg-transparent text-paper text-sm font-body focus:outline-none placeholder:text-paper/30 resize-none"
        />
      </div>

      <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mt-4">
        <label className="text-paper/40 text-xs font-body uppercase tracking-wide block mb-2">
          Own critique / risks
        </label>
        <textarea
          value={ownCritique}
          onChange={(e) => {
            setOwnCritique(e.target.value);
            isDirtyRef.current = true;
          }}
          placeholder="What's the strongest argument against your own thesis? What would make you wrong?"
          rows={3}
          className="w-full bg-transparent text-paper text-sm font-body focus:outline-none placeholder:text-paper/30 resize-none"
        />
      </div>

      {saveMessage && <p className="text-paper/60 text-sm font-body mt-3">{saveMessage}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setShowPreview(true)}
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={() => performSave("draft")}
          disabled={saving}
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={() => performSave("published")}
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

      {/* Right-side panel, per explicit request — a persistent quarter-width
          column rather than an inline box the reader has to scroll past
          everything else to find. Only rendered once the article has an
          id (a brand-new, unsaved draft has no collaborators to manage
          yet), and only for the original author, matching the RLS rule
          that only they can add/remove collaborators. */}
      {isAuthor && (
        <div className="w-1/4 shrink-0 sticky top-6">
          <CollaboratorManager articleId={articleId} collaborators={collaborators} />
        </div>
      )}
    </div>
  );
}
