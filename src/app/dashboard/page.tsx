import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import WelcomeModal from "./WelcomeModal";

const RARITY_ORDER = ["MUR", "UR", "SAR", "SR", "AR", "RR", "R", "N"];

const RARITY_BAR: Record<string, string> = {
  N:   "bg-gray-400",
  R:   "bg-blue-400",
  RR:  "bg-violet-400",
  AR:  "bg-rose-400",
  SR:  "bg-orange-400",
  SAR: "bg-amber-400",
  UR:  "bg-yellow-400",
  MUR: "bg-gradient-to-r from-yellow-400 to-amber-500",
};

const RARITY_LABEL: Record<string, string> = {
  N: "N", R: "R ★", RR: "RR ★★", AR: "AR ✦", SR: "SR ✦✦", SAR: "SAR ✦✦✦", UR: "UR ✦✦✦✦", MUR: "MUR",
};

const RARITY_FALLBACK: Record<string, string> = {
  N:   "from-gray-300 to-gray-400",
  R:   "from-blue-400 to-blue-600",
  RR:  "from-violet-400 to-violet-700",
  AR:  "from-rose-400 to-rose-600",
  SR:  "from-orange-400 to-orange-600",
  SAR: "from-amber-400 to-amber-600",
  UR:  "from-yellow-400 to-amber-500",
  MUR: "from-yellow-300 via-amber-400 to-orange-400",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const user = authData.user;

  const [{ data: profile }, { data: userCards }, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("nickname, balance, welcomed").eq("id", user.id).single(),
    supabase
      .from("user_cards")
      .select("card_id, acquired_at, cards(id, name, rarity, image_url, current_price)")
      .eq("user_id", user.id)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("pack_purchases")
      .select("id, cost, purchased_at, packs(name)")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false })
      .limit(30),
  ]);

  if (!profile?.nickname) redirect("/setup-profile");

  type RawCard = { id: string; name: string; rarity: string; image_url: string | null; current_price: number };

  const balance = profile?.balance ?? 0;
  const totalCards = userCards?.length ?? 0;
  const uniqueCards = new Set(userCards?.map((uc) => uc.card_id)).size;
  const duplicates = totalCards - uniqueCards;
  const pullCount = purchases?.length ?? 0;

  const totalSpent = (purchases ?? []).reduce((sum, p) => sum + p.cost, 0);

  const collectionValue = (userCards ?? []).reduce((sum, uc) => {
    const card = uc.cards as unknown as RawCard;
    return sum + (card?.current_price ?? 0);
  }, 0);

  // 등급별 보유 수
  const rarityMap: Record<string, number> = {};
  for (const uc of userCards ?? []) {
    const card = uc.cards as unknown as RawCard;
    if (!card) continue;
    rarityMap[card.rarity] = (rarityMap[card.rarity] ?? 0) + 1;
  }
  const maxRarityCount = Math.max(1, ...Object.values(rarityMap));

  // 가장 비싼 카드 TOP 5
  const topCards = (userCards ?? [])
    .map((uc) => uc.cards as unknown as RawCard)
    .filter(Boolean)
    .sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {profile?.welcomed === false && <WelcomeModal />}
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">내 통계</h1>
          <p className="text-sm text-gray-400 mt-0.5">컬렉션 현황과 뽑기 기록을 확인하세요</p>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="보유 코인" value={balance.toLocaleString()} unit="C" sub={`총 ${totalSpent.toLocaleString()} C 사용`} accent="text-violet-600" />
          <StatCard label="총 보유 카드" value={totalCards.toLocaleString()} unit="장" sub={`중복 ${duplicates}장 포함`} accent="text-blue-600" />
          <StatCard label="보유 종류" value={uniqueCards.toLocaleString()} unit="종" sub={`전체 카드 중 ${totalCards > 0 ? Math.round((uniqueCards / totalCards) * 100) : 0}% 고유`} accent="text-emerald-600" />
          <StatCard label="컬렉션 가치" value={collectionValue.toLocaleString()} unit="C" sub="보유 카드 현재가 합산" accent="text-amber-600" />
          <StatCard label="팩 뽑기 횟수" value={pullCount.toLocaleString()} unit="회" sub={pullCount > 0 ? `마지막: ${new Date((purchases ?? [])[0]?.purchased_at).toLocaleDateString("ko-KR")}` : "뽑기 기록 없음"} accent="text-rose-600" />
          <StatCard label="평균 카드 가치" value={totalCards > 0 ? Math.round(collectionValue / totalCards).toLocaleString() : "0"} unit="C" sub="컬렉션 가치 ÷ 보유 수" accent="text-indigo-600" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 등급별 보유 현황 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">등급별 보유 현황</h2>
            {totalCards === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">보유 카드가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {RARITY_ORDER.map((rarity) => {
                  const count = rarityMap[rarity] ?? 0;
                  const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
                  const barPct = Math.round((count / maxRarityCount) * 100);
                  return (
                    <div key={rarity}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-700">{RARITY_LABEL[rarity]}</span>
                        <span className="text-gray-400">
                          {count > 0 ? `${count}장 · ${pct}%` : "없음"}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${RARITY_BAR[rarity] ?? "bg-gray-400"} ${count === 0 ? "opacity-0" : ""}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 가치 높은 카드 TOP 5 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">가치 높은 카드 TOP 5</h2>
            {topCards.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">보유 카드가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {topCards.map((card, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-300 w-4 shrink-0">{i + 1}</span>
                    <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0">
                      {card.image_url ? (
                        <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{card.name}</p>
                      <p className="text-xs text-gray-400">{RARITY_LABEL[card.rarity] ?? card.rarity}</p>
                    </div>
                    <span className="text-sm font-bold text-violet-600 shrink-0">
                      {(card.current_price ?? 0).toLocaleString()} C
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 뽑기 이력 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">뽑기 이력</h2>
            <span className="text-xs text-gray-400">최근 30건</span>
          </div>
          {(purchases ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">뽑기 기록이 없습니다</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {(purchases ?? []).map((p, i) => {
                const pack = p.packs as unknown as { name: string } | null;
                return (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-300 font-medium w-5 text-right shrink-0">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{pack?.name ?? "팩"}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(p.purchased_at).toLocaleDateString("ko-KR", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-500">−{p.cost.toLocaleString()} C</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">계정 정보</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-0.5">닉네임</p>
              <p className="font-medium text-gray-800">{profile?.nickname}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">이메일</p>
              <p className="font-medium text-gray-800 truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">가입일</p>
              <p className="font-medium text-gray-800">{new Date(user.created_at).toLocaleDateString("ko-KR")}</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ label, value, unit, sub, accent }: {
  label: string; value: string; unit: string; sub: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>
        {value} <span className="text-sm font-medium text-gray-400">{unit}</span>
      </p>
      <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
    </div>
  );
}
