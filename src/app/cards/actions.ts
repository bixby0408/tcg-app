"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function discardCard(cardId: string, quantity: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "로그인이 필요합니다" };

  const qty = Math.max(1, Math.floor(quantity));

  const { data: rows } = await supabase
    .from("user_cards")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("card_id", cardId)
    .order("acquired_at", { ascending: true })
    .limit(qty);

  if (!rows || rows.length === 0) return { error: "카드를 찾을 수 없습니다" };

  const ids = rows.map((r) => r.id);
  const { error } = await supabase.from("user_cards").delete().in("id", ids);

  if (error) return { error: error.message };
  revalidatePath("/cards");
  return {};
}

// 즉시판매: 시세의 85% 지급, 시세 변동 없음
export async function sellCard(
  cardId: string,
  quantity: number
): Promise<{ error?: string; earned?: number }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "로그인이 필요합니다" };

  const userId = authData.user.id;
  const qty = Math.max(1, Math.floor(quantity));

  // 카드 시세 조회
  const { data: cardData } = await supabase
    .from("cards")
    .select("current_price")
    .eq("id", cardId)
    .single();

  if (!cardData) return { error: "카드 정보를 찾을 수 없습니다" };

  const earned = Math.floor(cardData.current_price * 0.85) * qty;

  // 오래된 순으로 qty장 조회
  const { data: rows } = await supabase
    .from("user_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .order("acquired_at", { ascending: true })
    .limit(qty);

  if (!rows || rows.length === 0) return { error: "카드를 찾을 수 없습니다" };

  const ids = rows.map((r) => r.id);
  const { error: deleteErr } = await supabase.from("user_cards").delete().in("id", ids);
  if (deleteErr) return { error: deleteErr.message };

  // 잔액 증가
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();

  await supabase
    .from("profiles")
    .update({ balance: (profile?.balance ?? 0) + earned })
    .eq("id", userId);

  revalidatePath("/cards");
  revalidatePath("/packs");
  return { earned };
}

// 일괄 즉시판매
export async function bulkSellCards(
  items: { cardId: string; quantity: number }[]
): Promise<{ error?: string; totalEarned?: number }> {
  if (!items.length) return { error: "선택된 카드가 없습니다" };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "로그인이 필요합니다" };

  const userId = authData.user.id;

  // 카드 시세 일괄 조회
  const cardIds = items.map((i) => i.cardId);
  const { data: cards } = await supabase
    .from("cards")
    .select("id, current_price")
    .in("id", cardIds);

  if (!cards) return { error: "카드 정보를 불러올 수 없습니다" };

  const priceMap = new Map(cards.map((c) => [c.id, c.current_price]));

  let totalEarned = 0;
  const allIdsToDelete: string[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity));
    const price = priceMap.get(item.cardId) ?? 0;
    totalEarned += Math.floor(price * 0.85) * qty;

    const { data: rows } = await supabase
      .from("user_cards")
      .select("id")
      .eq("user_id", userId)
      .eq("card_id", item.cardId)
      .order("acquired_at", { ascending: true })
      .limit(qty);

    if (rows) allIdsToDelete.push(...rows.map((r) => r.id));
  }

  if (allIdsToDelete.length === 0) return { error: "판매할 카드를 찾을 수 없습니다" };

  const { error: deleteErr } = await supabase
    .from("user_cards")
    .delete()
    .in("id", allIdsToDelete);

  if (deleteErr) return { error: deleteErr.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();

  await supabase
    .from("profiles")
    .update({ balance: (profile?.balance ?? 0) + totalEarned })
    .eq("id", userId);

  revalidatePath("/cards");
  revalidatePath("/packs");
  return { totalEarned };
}
