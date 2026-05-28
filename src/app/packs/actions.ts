"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PulledCard = {
  userCardId: string;
  card: {
    id: string;
    name: string;
    rarity: string;
    card_type: string | null;
    description: string | null;
    series: string | null;
    card_number: string | null;
    current_price: number;
    image_url: string | null;
  };
};

export type BuyPackResult =
  | { success: true; cards: PulledCard[] }
  | { success: false; error: string };

function weightedRandom(
  pool: { card_id: string; weight: number }[],
  count: number
): string[] {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * total;
    for (const item of pool) {
      rand -= item.weight;
      if (rand <= 0) {
        results.push(item.card_id);
        break;
      }
    }
  }
  return results;
}

export async function buyPack(packId: string): Promise<BuyPackResult> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { success: false, error: "로그인이 필요합니다" };

  const userId = authData.user.id;

  // 팩 정보
  const { data: pack } = await supabase
    .from("packs")
    .select("id, price, cards_per_pack, is_active")
    .eq("id", packId)
    .single();

  if (!pack?.is_active) return { success: false, error: "존재하지 않는 팩입니다" };

  // 잔액 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();

  if (!profile || profile.balance < pack.price) {
    return {
      success: false,
      error: `코인이 부족합니다 (필요: ${pack.price}, 보유: ${profile?.balance ?? 0})`,
    };
  }

  // 팩 구성 카드 목록
  const { data: packCards } = await supabase
    .from("pack_cards")
    .select("card_id, weight, cards(id, name, rarity, card_type, description, series, card_number, current_price, image_url)")
    .eq("pack_id", packId);

  if (!packCards || packCards.length === 0)
    return { success: false, error: "팩에 카드가 등록되어 있지 않습니다" };

  // 가중치 뽑기
  const pool = packCards.map((pc) => ({ card_id: pc.card_id, weight: pc.weight }));
  const selectedIds = weightedRandom(pool, pack.cards_per_pack);

  const cardMap = new Map(packCards.map((pc) => [pc.card_id, pc.cards as unknown as PulledCard["card"]]));

  // user_cards 삽입
  const { data: inserted, error: insertErr } = await supabase
    .from("user_cards")
    .insert(selectedIds.map((cardId) => ({ user_id: userId, card_id: cardId, acquired_via: "pack" })))
    .select("id, card_id");

  if (insertErr || !inserted) return { success: false, error: "카드 지급 중 오류가 발생했습니다" };

  // 잔액 차감
  await supabase
    .from("profiles")
    .update({ balance: profile.balance - pack.price })
    .eq("id", userId);

  // 뽑기 기록
  await supabase.from("pack_purchases").insert({ user_id: userId, pack_id: packId, cost: pack.price });

  revalidatePath("/packs");
  revalidatePath("/cards");

  return {
    success: true,
    cards: inserted.map((uc) => ({ userCardId: uc.id, card: cardMap.get(uc.card_id)! })),
  };
}
