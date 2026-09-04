"use client";

import { useState } from "react";
import SimpleAssetTable from "./SimpleAssetTable";

export default function AssetTableClient({ rows, priceLabel, assetType }) {
  const [view, setView] = useState("daily");

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex rounded-md border border-ink-700 overflow-hidden text-xs font-mono">
          <button
            onClick={() => setView("daily")}
            className={`px-3 py-1.5 ${
              view === "daily" ? "bg-brass-500 text-ink-950" : "text-paper/60 hover:bg-ink-800"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView("rolling3")}
            className={`px-3 py-1.5 ${
              view === "rolling3" ? "bg-brass-500 text-ink-950" : "text-paper/60 hover:bg-ink-800"
            }`}
          >
            Rolling 3-day
          </button>
        </div>
      </div>
      <SimpleAssetTable rows={rows} priceLabel={priceLabel} view={view} assetType={assetType} />
    </div>
  );
}
