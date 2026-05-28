"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function discardCard(cardId: string, quantity: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "로그인이 필요합니다" };

  const qty = Math.max(1, Math.floor(quantity));

  // 오래된 순으로 qty장 조회
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
