import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import MarketClient from "./_components/MarketClient";

export type Listing = {
  id: string;
  price: number;
  created_at: string;
  seller_id: string;
  seller_nickname: string;
  isMine: boolean;
  card: {
    id: string;
    name: string;
    rarity: string;
    image_url: string | null;
    current_price: number;
  };
};

export type MyCard = {
  userCardId: string;
  card: {
    id: string;
    name: string;
    rarity: string;
    image_url: string | null;
    current_price: number;
  };
};

export default async function MarketPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const userId = authData.user.id;

  const [{ data: rawListings }, { data: rawMyCards }, { data: profile }] = await Promise.all([
    supabase
      .from("market_listings")
      .select("id, price, created_at, seller_id, user_cards(id, cards(id, name, rarity, image_url, current_price))")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_cards")
      .select("id, cards(id, name, rarity, image_url, current_price)")
      .eq("user_id", userId)
      .eq("is_listed", false),
    supabase.from("profiles").select("balance").eq("id", userId).single(),
  ]);

  // 판매자 닉네임 일괄 조회
  const sellerIds = [...new Set((rawListings ?? []).map((l) => l.seller_id))];
  const { data: sellers } = sellerIds.length > 0
    ? await supabase.from("profiles").select("id, nickname").in("id", sellerIds)
    : { data: [] };
  const sellerMap = new Map((sellers ?? []).map((s) => [s.id, s.nickname ?? "알 수 없음"]));

  type RawCard = { id: string; name: string; rarity: string; image_url: string | null; current_price: number };

  const listings: Listing[] = (rawListings ?? [])
    .map((l) => {
      const uc = l.user_cards as unknown as { id: string; cards: RawCard } | null;
      if (!uc?.cards) return null;
      return {
        id: l.id,
        price: l.price,
        created_at: l.created_at,
        seller_id: l.seller_id,
        seller_nickname: sellerMap.get(l.seller_id) ?? "알 수 없음",
        isMine: l.seller_id === userId,
        card: uc.cards,
      };
    })
    .filter((l): l is Listing => l !== null);

  type RawMyCard = { id: string; name: string; rarity: string; image_url: string | null; current_price: number };
  const myCards: MyCard[] = (rawMyCards ?? [])
    .map((uc) => {
      const card = uc.cards as unknown as RawMyCard | null;
      if (!card) return null;
      return { userCardId: uc.id, card };
    })
    .filter((uc): uc is MyCard => uc !== null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MarketClient
        listings={listings}
        myCards={myCards}
        balance={profile?.balance ?? 0}
        userId={userId}
      />
    </div>
  );
}
