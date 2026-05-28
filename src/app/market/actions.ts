"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; success?: boolean };

async function getAuthUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data?.user ?? null };
}

export async function listCard(userCardId: string, price: number): Promise<Result> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "로그인이 필요합니다" };
  if (price <= 0) return { error: "가격은 0보다 커야 합니다" };

  const { error } = await supabase.from("market_listings").insert({
    seller_id: user.id,
    user_card_id: userCardId,
    price,
  });
  if (error) return { error: error.message };

  await supabase.from("user_cards").update({ is_listed: true }).eq("id", userCardId);

  revalidatePath("/market");
  revalidatePath("/cards");
  return { success: true };
}

export async function cancelListing(listingId: string): Promise<Result> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data: listing } = await supabase
    .from("market_listings")
    .select("user_card_id")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .single();

  if (!listing) return { error: "판매글을 찾을 수 없습니다" };

  const { error } = await supabase
    .from("market_listings")
    .update({ status: "cancelled" })
    .eq("id", listingId);

  if (error) return { error: error.message };

  await supabase.from("user_cards").update({ is_listed: false }).eq("id", listing.user_card_id);

  revalidatePath("/market");
  revalidatePath("/cards");
  return { success: true };
}

export async function buyCard(listingId: string): Promise<Result> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("purchase_card", { p_listing_id: listingId });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  revalidatePath("/market");
  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

type PricePoint = { price: number; transaction_type: string; created_at: string };

export async function getCardPriceHistory(cardId: string): Promise<PricePoint[]> {
  const { supabase } = await getAuthUser();
  const { data } = await supabase
    .from("card_price_history")
    .select("price, transaction_type, created_at")
    .eq("card_id", cardId)
    .order("created_at", { ascending: true })
    .limit(30);
  return (data ?? []) as PricePoint[];
}

export async function instantSellCard(userCardId: string): Promise<Result & { sell_price?: number }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data, error } = await supabase.rpc("instant_sell_card", { p_user_card_id: userCardId });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  revalidatePath("/market");
  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true, sell_price: data?.sell_price };
}
