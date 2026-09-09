"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/member/watchlists");
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
  revalidatePath("/member/watchlists");
  return { success: true };
}

export async function addWatchlistItem(watchlistId, symbol, market) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!symbol || !symbol.trim()) return { error: "Please enter a ticker symbol." };
  if (!market) return { error: "Please choose a market." };

  const { error } = await supabase.from("watchlist_items").insert({
    watchlist_id: watchlistId,
    symbol: symbol.trim().toUpperCase(),
    market,
  });

  if (error) return { error: "Could not add that ticker — please try again." };
  revalidatePath("/member/watchlists");
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
  revalidatePath("/member/watchlists");
  return { success: true };
}
