import { ImageResponse } from "next/og";
import { createClient } from "../../../lib/supabase/server";
import { enrichWithMarketData } from "../../../lib/reportData";
import { AVAILABLE_COLUMNS, formatColumnValue } from "../../../lib/watchlistColumns";

export const runtime = "nodejs"; // needs the Supabase server client + filesystem-based getMarketData, neither of which run on the Edge runtime

function formatPrice(value) {
  return value != null ? `$${value.toFixed(2)}` : "—";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return new Response("Missing watchlistId", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Not signed in", { status: 401 });
  }

  // Explicit ownership check rather than relying on RLS alone — this
  // is a Route Handler, not a page render, and being deliberate about
  // the auth boundary here matters specifically because this endpoint
  // returns generated content, not just structured data through the
  // normal client.
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("id, name, report_title, visible_columns")
    .eq("id", watchlistId)
    .eq("user_id", user.id)
    .single();

  if (!watchlist) {
    return new Response("Not found", { status: 404 });
  }

  const { data: items } = await supabase
    .from("watchlist_items")
    .select("id, watchlist_id, symbol, market")
    .eq("watchlist_id", watchlistId);

  const enrichedItems = enrichWithMarketData(items || []);
  const activeColumns = AVAILABLE_COLUMNS.filter((c) => (watchlist.visible_columns || []).includes(c.key));

  // Satori (the engine behind ImageResponse) only supports a limited
  // CSS subset — flexbox layouts, no real <table>, no CSS grid. Every
  // "row" here is a manually-built flex row rather than actual table
  // markup, and styling sticks to well-established safe properties
  // (flex, padding, backgroundColor, color, fontSize, border) rather
  // than anything more exotic that Satori might not render correctly.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0f",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#e8b04b", fontSize: 22, fontWeight: 700 }}>InfinityVolume</span>
        </div>

        <span style={{ color: "#f5f3ee", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
          {watchlist.name}
        </span>

        {watchlist.report_title ? (
          <span style={{ color: "#a8a6a0", fontSize: 18, marginBottom: 24 }}>{watchlist.report_title}</span>
        ) : (
          <div style={{ marginBottom: 16 }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", border: "1px solid #2a2a33", borderRadius: 8 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#16161d",
              padding: "12px 16px",
              borderBottom: "1px solid #2a2a33",
            }}
          >
            <span style={{ color: "#8a8880", fontSize: 13, width: 200 }}>TICKER</span>
            <span style={{ color: "#8a8880", fontSize: 13, width: 100 }}>MARKET</span>
            <span style={{ color: "#8a8880", fontSize: 13, width: 120, textAlign: "right" }}>PRICE</span>
            <span style={{ color: "#8a8880", fontSize: 13, width: 140, textAlign: "right" }}>VOLUME</span>
            {activeColumns.map((col) => (
              <span key={col.key} style={{ color: "#8a8880", fontSize: 13, width: 140, textAlign: "right" }}>
                {col.label.toUpperCase()}
              </span>
            ))}
          </div>
          {enrichedItems.slice(0, 12).map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                padding: "10px 16px",
                borderBottom: i < enrichedItems.length - 1 ? "1px solid #1c1c24" : "none",
              }}
            >
              <span style={{ color: "#e8b04b", fontSize: 15, width: 200, fontWeight: 600 }}>{item.symbol}</span>
              <span style={{ color: "#a8a6a0", fontSize: 15, width: 100 }}>{item.market}</span>
              <span style={{ color: "#f5f3ee", fontSize: 15, width: 120, textAlign: "right" }}>
                {formatPrice(item.currentPrice)}
              </span>
              <span style={{ color: "#c8c6c0", fontSize: 15, width: 140, textAlign: "right" }}>
                {formatColumnValue(item.currentVolume, "usd_compact")}
              </span>
              {activeColumns.map((col) => (
                <span key={col.key} style={{ color: "#c8c6c0", fontSize: 15, width: 140, textAlign: "right" }}>
                  {formatColumnValue(item[col.field], col.format)}
                </span>
              ))}
            </div>
          ))}
        </div>

        <span style={{ color: "#5a5850", fontSize: 12, marginTop: 20 }}>
          Generated on InfinityVolume · infinityvolume.com
        </span>
      </div>
    ),
    { width: 1200, height: 630 + Math.max(0, enrichedItems.length - 6) * 40 }
  );
}
