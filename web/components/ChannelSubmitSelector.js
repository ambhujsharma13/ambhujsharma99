// Pure channel picker — no submit button.
// Parent (ArticleEditor) owns selectedPublic + selectedPrivate state
// and passes them up via onChange. Submission happens when Publish is clicked.

const MAX_PUBLIC = 2;
const MAX_PRIVATE = 5;

export default function ChannelSubmitSelector({
  publicChannels = [],
  privateChannels = [],
  selectedPublic = [],
  selectedPrivate = [],
  onChange,
  submitting = false,
  submitted = false,
}) {
  function togglePublic(id) {
    const next = selectedPublic.includes(id)
      ? selectedPublic.filter(x => x !== id)
      : selectedPublic.length < MAX_PUBLIC
        ? [...selectedPublic, id]
        : selectedPublic;
    onChange({ selectedPublic: next, selectedPrivate });
  }

  function togglePrivate(id) {
    const next = selectedPrivate.includes(id)
      ? selectedPrivate.filter(x => x !== id)
      : selectedPrivate.length < MAX_PRIVATE
        ? [...selectedPrivate, id]
        : selectedPrivate;
    onChange({ selectedPublic, selectedPrivate: next });
  }

  const total = selectedPublic.length + selectedPrivate.length;

  if (submitted) {
    return (
      <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
        <p className="text-gain text-xs font-body text-center">
          ✓ Submitted to {total} channel{total === 1 ? "" : "s"} for review
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <h3 className="text-paper/80 text-sm font-body font-medium mb-1">Submit to channels</h3>
      <p className="text-paper/40 text-[11px] font-body mb-3 leading-relaxed">
        Select channels before publishing. Public channels go to the RA review queue.
        Private channels publish immediately.
      </p>

      {publicChannels.length > 0 && (
        <div className="mb-3">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide mb-1.5">
            Public ({selectedPublic.length}/{MAX_PUBLIC})
          </p>
          <div className="space-y-1">
            {publicChannels.map(ch => {
              const selected = selectedPublic.includes(ch.id);
              const capped = !selected && selectedPublic.length >= MAX_PUBLIC;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => !capped && togglePublic(ch.id)}
                  disabled={submitting}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-body transition-colors flex items-center gap-1.5 ${
                    selected
                      ? "bg-brass-400/15 text-brass-400 border border-brass-400/30"
                      : capped
                        ? "text-paper/20 cursor-not-allowed"
                        : "text-paper/55 hover:bg-ink-800 border border-transparent"
                  }`}
                >
                  <span>🌐</span>
                  <span className="truncate flex-1">{ch.name}</span>
                  {selected && <span className="text-[10px] shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {privateChannels.length > 0 && (
        <div>
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide mb-1.5">
            Private ({selectedPrivate.length}/{MAX_PRIVATE})
          </p>
          <div className="space-y-1">
            {privateChannels.map(ch => {
              const selected = selectedPrivate.includes(ch.id);
              const capped = !selected && selectedPrivate.length >= MAX_PRIVATE;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => !capped && togglePrivate(ch.id)}
                  disabled={submitting}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-body transition-colors flex items-center gap-1.5 ${
                    selected
                      ? "bg-brass-400/15 text-brass-400 border border-brass-400/30"
                      : capped
                        ? "text-paper/20 cursor-not-allowed"
                        : "text-paper/55 hover:bg-ink-800 border border-transparent"
                  }`}
                >
                  <span>🔒</span>
                  <span className="truncate flex-1">{ch.name}</span>
                  {selected && <span className="text-[10px] shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {publicChannels.length === 0 && privateChannels.length === 0 && (
        <p className="text-paper/25 text-xs font-body">No channels available.</p>
      )}

      {total > 0 && (
        <p className="text-paper/30 text-[10px] font-body mt-3 text-center">
          {total} channel{total === 1 ? "" : "s"} selected — will submit when you publish
        </p>
      )}
    </div>
  );
}
