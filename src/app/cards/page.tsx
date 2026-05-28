import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CardCollection from "./_components/CardCollection";

type RawCard = {
  id: string;
  name: string;
  rarity: string;
  card_type: string | null;
  card_number: string | null;
  series: string | null;
  current_price: number;
  image_url: string | null;
};

export type OwnedCard = {
  card: RawCard;
  count: number;
  latestAcquiredAt: string;
};

export default async function CardsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");

  const [{ data: userCards }, { data: profile }] = await Promise.all([
    supabase
      .from("user_cards")
      .select("card_id, acquired_at, cards(id, name, rarity, card_type, card_number, series, current_price, image_url)")
      .eq("user_id", authData.user.id)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("nickname, balance")
      .eq("id", authData.user.id)
      .single(),
  ]);

  // 카드별로 묶기
  const grouped = new Map<string, OwnedCard>();
  for (const uc of userCards ?? []) {
    const card = uc.cards as unknown as RawCard;
    if (!card) continue;
    if (!grouped.has(uc.card_id)) {
      grouped.set(uc.card_id, { card, count: 0, latestAcquiredAt: uc.acquired_at });
    }
    const entry = grouped.get(uc.card_id)!;
    entry.count++;
    if (uc.acquired_at > entry.latestAcquiredAt) entry.latestAcquiredAt = uc.acquired_at;
  }

  const ownedCards = Array.from(grouped.values());
  const totalCount = userCards?.length ?? 0;

  return (
    <>
      <Navbar />
      <CardCollection
        ownedCards={ownedCards}
        totalCount={totalCount}
        balance={profile?.balance ?? 0}
        nickname={profile?.nickname ?? ""}
      />
    </>
  );
}
