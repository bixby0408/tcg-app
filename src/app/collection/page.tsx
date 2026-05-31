import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { registerCard, unregisterCard } from "./actions";

const RARITY_ORDER = ["MUR", "UR", "SAR", "SR", "AR", "RR", "R", "N"] as const;

const RARITY_COLOR: Record<string, string> = {
  N:   "bg-gray-100 text-gray-600",
  R:   "bg-blue-100 text-blue-700",
  RR:  "bg-violet-100 text-violet-700",
  AR:  "bg-rose-100 text-rose-700",
  SR:  "bg-orange-100 text-orange-700",
  SAR: "bg-amber-100 text-amber-700",
  UR:  "bg-yellow-100 text-yellow-800",
  MUR: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-900",
};

const RARITY_BORDER: Record<string, string> = {
  N:   "border-gray-200",
  R:   "border-blue-200",
  RR:  "border-violet-300",
  AR:  "border-rose-300",
  SR:  "border-orange-300",
  SAR: "border-amber-300",
  UR:  "border-yellow-400",
  MUR: "border-yellow-400",
};

type Card = {
  id: string;
  name: string;
  rarity: string;
  image_url: string | null;
};

type DexSet = {
  id: string;
  name: string;
  description: string | null;
  reward_description: string | null;
};

type SetCard = {
  set_id: string;
  card_id: string;
  cards: Card | null;
};

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const userId = authData.user.id;

  const [
    { data: setsRaw },
    { data: setCardsRaw },
    { data: userCardsRaw },
    { data: registrationsRaw },
  ] = await Promise.all([
    supabase.from("dex_sets").select("id, name, description, reward_description").order("created_at"),
    supabase.from("dex_set_cards").select("set_id, card_id, cards(id, name, rarity, image_url)"),
    supabase.from("user_cards").select("card_id").eq("user_id", userId),
    supabase.from("dex_registrations").select("set_id, card_id").eq("user_id", userId),
  ]);

  const sets: DexSet[] = (setsRaw ?? []) as DexSet[];
  const setCards: SetCard[] = (setCardsRaw ?? []) as unknown as SetCard[];
  const ownedCardIds = new Set((userCardsRaw ?? []).map((uc) => uc.card_id));
  const registeredKeys = new Set(
    (registrationsRaw ?? []).map((r) => `${r.set_id}:${r.card_id}`)
  );

  const completedSets = sets.filter((set) => {
    const cards = setCards.filter((sc) => sc.set_id === set.id);
    return cards.length > 0 && cards.every((sc) => registeredKeys.has(`${set.id}:${sc.card_id}`));
  }).length;

  if (sets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-4xl mb-4">📖</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">도감이 아직 비어있어요</h1>
          <p className="text-sm text-gray-400">관리자가 도감 세트를 등록하면 여기에 표시됩니다</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">도감</h1>
          <p className="text-sm text-gray-400 mt-0.5">카드를 등록해 도감을 완성하세요</p>
        </div>

        {/* 전체 진행도 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">전체 달성률</p>
            <p className="text-sm font-bold text-violet-600">{completedSets} / {sets.length} 세트</p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
              style={{ width: sets.length > 0 ? `${(completedSets / sets.length) * 100}%` : "0%" }}
            />
          </div>
          {(() => {
            const totalCards = setCards.length;
            const registeredCount = (registrationsRaw ?? []).length;
            return (
              <p className="text-xs text-gray-400 mt-2">
                전체 카드 {totalCards}장 중 {registeredCount}장 등록됨
              </p>
            );
          })()}
        </div>

        {/* 세트 목록 */}
        <div className="space-y-4">
          {sets.map((set) => {
            const cards = setCards
              .filter((sc) => sc.set_id === set.id && sc.cards)
              .sort((a, b) => {
                const ai = RARITY_ORDER.indexOf(a.cards!.rarity as typeof RARITY_ORDER[number]);
                const bi = RARITY_ORDER.indexOf(b.cards!.rarity as typeof RARITY_ORDER[number]);
                return ai - bi;
              });

            const registeredCount = cards.filter((sc) =>
              registeredKeys.has(`${set.id}:${sc.card_id}`)
            ).length;
            const isComplete = cards.length > 0 && registeredCount === cards.length;
            const pct = cards.length > 0 ? Math.round((registeredCount / cards.length) * 100) : 0;

            return (
              <div
                key={set.id}
                className={`bg-white rounded-2xl border p-6 ${isComplete ? "border-yellow-300 bg-yellow-50/30" : "border-gray-100"}`}
              >
                {/* 세트 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{set.name}</h2>
                      {isComplete && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                          완성
                        </span>
                      )}
                    </div>
                    {set.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{set.description}</p>
                    )}
                    {set.reward_description && (
                      <p className="text-xs text-amber-600 mt-0.5">보상: {set.reward_description}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-500 shrink-0 ml-4">
                    {registeredCount} / {cards.length}
                  </p>
                </div>

                {/* 진행률 바 */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full transition-all ${isComplete ? "bg-yellow-400" : "bg-violet-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* 카드 그리드 */}
                {cards.length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-4">이 세트에 카드가 없습니다</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {cards.map((sc) => {
                      const card = sc.cards!;
                      const isOwned = ownedCardIds.has(sc.card_id);
                      const isRegistered = registeredKeys.has(`${set.id}:${sc.card_id}`);

                      return (
                        <div key={sc.card_id} className="flex flex-col items-center gap-1.5">
                          {/* 카드 이미지 */}
                          <div
                            className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                              isRegistered
                                ? RARITY_BORDER[card.rarity] ?? "border-gray-200"
                                : isOwned
                                ? "border-gray-200"
                                : "border-gray-100"
                            }`}
                          >
                            {card.image_url ? (
                              <img
                                src={card.image_url}
                                alt={card.name}
                                className={`w-full h-full object-cover transition-all ${
                                  isRegistered ? "" : isOwned ? "opacity-60 grayscale" : "opacity-25 grayscale"
                                }`}
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                                  isRegistered ? RARITY_COLOR[card.rarity] : "bg-gray-100 text-gray-300"
                                }`}
                              >
                                {card.rarity}
                              </div>
                            )}

                            {/* 등록 완료 체크 */}
                            {isRegistered && (
                              <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                                <span className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded font-bold">
                                  등록됨
                                </span>
                              </div>
                            )}

                            {/* 미보유 물음표 */}
                            {!isOwned && !isRegistered && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl text-gray-300">?</span>
                              </div>
                            )}
                          </div>

                          {/* 카드 이름 + 등급 */}
                          <div className="w-full text-center">
                            <p className={`text-xs font-medium truncate w-full ${isOwned || isRegistered ? "text-gray-800" : "text-gray-300"}`}>
                              {isOwned || isRegistered ? card.name : "???"}
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isOwned || isRegistered ? RARITY_COLOR[card.rarity] : "bg-gray-100 text-gray-300"}`}>
                              {card.rarity}
                            </span>
                          </div>

                          {/* 등록 / 취소 버튼 */}
                          {isRegistered ? (
                            <form action={unregisterCard}>
                              <input type="hidden" name="set_id" value={set.id} />
                              <input type="hidden" name="card_id" value={sc.card_id} />
                              <button
                                type="submit"
                                className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
                              >
                                취소
                              </button>
                            </form>
                          ) : isOwned ? (
                            <form action={registerCard}>
                              <input type="hidden" name="set_id" value={set.id} />
                              <input type="hidden" name="card_id" value={sc.card_id} />
                              <button
                                type="submit"
                                className="text-[10px] px-2 py-0.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold transition-colors"
                              >
                                등록
                              </button>
                            </form>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
