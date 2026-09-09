"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { getMarketData } from "./getMarketData";

export async function createWatchlist(name) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!name || !name.trim()) return { error: "Please give the watchlist a name." };

  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: user.id, name: name.trim() })
    .select("id")
    .single();

  if (error) return { error: "Could not create the watchlist — please try again." };
  revalidatePath("/member/reports");
  return { watchlistId: data.id };
}

export async function deleteWatchlist(watchlistId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS already restricts this to the owner, but filtering by user_id
  // explicitly here too keeps the query's intent readable.
  const { error } = await supabase.from("watchlists").delete().eq("id", watchlistId).eq("user_id", user.id);
  if (error) return { error: "Could not delete — please try again." };
  revalidatePath("/member/reports");
  return { success: true };
}

// Resolves whatever the user typed — an exact symbol ("AAPL") or a
// company name ("Apple", "apple", case-insensitive) — to the real
// tracked symbol, using data already on disk (the same __name__ prefix
// convention read everywhere else on the site). Confirmed necessary
// after real testing: without this, typing "Apple" saved the literal
// string "APPLE" as the symbol, which never matches anything in the
// market data (only "AAPL" does), silently showing no price/volume
// with no indication of why.
function resolveSymbol(input, market) {
  const marketData = getMarketData(market);
  if (!marketData?.tickers) return null;

  const cleaned = input.trim();
  const upper = cleaned.toUpperCase();
  const lowerInput = cleaned.toLowerCase();

  // Exact symbol match first (the common, fast case).
  if (marketData.tickers[upper] !== undefined) return upper;

  // Exact name match next, then a "name starts with input" fallback —
  // confirmed necessary after real testing: typing "micron" alone
  // didn't match "Micron Technology" (the actual tracked name) under
  // exact-match-only logic, since people commonly type a shortened or
  // common form of a company's name, not its full legal name.
  let startsWithMatch = null;
  for (const key of Object.keys(marketData.tickers)) {
    if (!key.startsWith("__name__")) continue;
    const trackedName = marketData.tickers[key].toLowerCase();
    if (trackedName === lowerInput) return key.replace("__name__", ""); // exact match wins immediately
    if (!startsWithMatch && trackedName.startsWith(lowerInput)) {
      startsWithMatch = key.replace("__name__", "");
    }
  }
  return startsWithMatch;
}

export async function addWatchlistItem(watchlistId, symbolInput, market) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!symbolInput || !symbolInput.trim()) return { error: "Please enter a ticker symbol." };
  if (!market) return { error: "Please choose a market." };

  // Wrapped in try/catch deliberately: without this, any unexpected
  // exception inside resolveSymbol (a malformed data file, a market
  // with a genuinely different shape, anything unforeseen) would
  // reject this whole async function silently from the caller's
  // perspective — confirmed as a real gap after real testing showed
  // "nothing happens, no error, no success" when something went wrong,
  // which is a symptom of an uncaught rejection, not a graceful error
  // return.
  let resolvedSymbol;
  try {
    resolvedSymbol = resolveSymbol(symbolInput, market);
  } catch (err) {
    console.error("resolveSymbol threw an unexpected error:", err);
    return { error: `Something went wrong looking up "${symbolInput}" — check the server terminal for details.` };
  }

  if (!resolvedSymbol) {
    return {
      error: `"${symbolInput}" isn't a tracked ticker or company name in ${market}. Try the exact ticker symbol (e.g. AAPL).`,
    };
  }

  const { error } = await supabase.from("watchlist_items").insert({
    watchlist_id: watchlistId,
    symbol: resolvedSymbol,
    market,
  });

  if (error) return { error: "Could not add that ticker — please try again." };
  revalidatePath("/member/reports");
  return { success: true };
}

export async function removeWatchlistItem(itemId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("watchlist_items").delete().eq("id", itemId);
  if (error) return { error: "Could not remove that ticker — please try again." };
  revalidatePath("/member/reports");
  return { success: true };
}

export async function updateWatchlistColumns(watchlistId, columns) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("watchlists")
    .update({ visible_columns: columns })
    .eq("id", watchlistId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not save column preferences — please try again." };
  revalidatePath("/member/reports");
  return { success: true };
}

export async function updateReportTitle(watchlistId, title) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("watchlists")
    .update({ report_title: title })
    .eq("id", watchlistId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not save the title — please try again." };
  revalidatePath("/member/reports");
  return { success: true };
}
