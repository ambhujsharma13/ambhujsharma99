"use client";

export default function RangeSelector({ availableDates, range, onChange, presets }) {
  if (!availableDates || availableDates.length === 0) return null;

  const minDate = availableDates[0];
  const maxDate = availableDates[availableDates.length - 1];

  function applyPreset(days) {
    const end = maxDate;
    const start = availableDates[Math.max(0, availableDates.length - days)];
    onChange({ startDate: start, endDate: end });
  }

  const isActivePreset = (days) => {
    const expectedStart = availableDates[Math.max(0, availableDates.length - days)];
    return range.startDate === expectedStart && range.endDate === maxDate;
  };

  return (
    <div className="mb-6 border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="grid grid-cols-4 gap-2 flex-1">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className={`py-3 px-4 rounded-md font-display text-base transition-colors ${
                isActivePreset(p.days)
                  ? "bg-brass-500 text-ink-950 shadow-lg shadow-brass-500/20"
                  : "bg-ink-800 text-paper/70 hover:bg-ink-700 hover:text-paper"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-paper/50 lg:pl-4 lg:border-l lg:border-ink-700">
          <span className="whitespace-nowrap">Custom range:</span>
          <input
            type="date"
            value={range.startDate}
            min={minDate}
            max={range.endDate}
            onChange={(e) => onChange({ startDate: e.target.value, endDate: range.endDate })}
            className="bg-ink-800 border border-ink-700 rounded px-2 py-2 text-paper"
          />
          <span>to</span>
          <input
            type="date"
            value={range.endDate}
            min={range.startDate}
            max={maxDate}
            onChange={(e) => onChange({ startDate: range.startDate, endDate: e.target.value })}
            className="bg-ink-800 border border-ink-700 rounded px-2 py-2 text-paper"
          />
        </div>
      </div>
      <p className="text-paper/30 text-[11px] font-body mt-3">
        Data available for the last {availableDates.length} entries
      </p>
    </div>
  );
}
