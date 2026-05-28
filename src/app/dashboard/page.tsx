import { redirect } from "next/navigation";
import Link from "next/link";
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
  N: "N", R: "R", RR: "RR", AR: "AR", SR: "SR", SAR: "SAR", UR: "UR", MUR: "MUR",
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
      .limit(5),
  ]);

  const displayName = profile?.nickname || user.email?.split("@")[0] || "플레이어";
  const balance = profile?.balance ?? 0;
  const totalCards = userCards?.length ?? 0;
  const uniqueCards = new Set(userCards?.map((uc) => uc.card_id)).size;
  const pullCount = purchases?.length ?? 0;

  // 최근 뽑은 카드 6장 (중복 포함, 실제 뽑은 순서)
  type RawCard = { id: string; name: string; rarity: string; image_url: string | null; current_price: number };
  const recentCards = (userCards ?? [])
    .slice(0, 6)
    .map((uc) => uc.cards as unknown as RawCard)
    .filter(Boolean);

  // 등급별 보유 수
  const rarityMap: Record<string, number> = {};
  for (const uc of userCards ?? []) {
    const card = uc.cards as unknown as RawCard;
    if (!card) continue;
    rarityMap[card.rarity] = (rarityMap[card.rarity] ?? 0) + 1;
  }
  const maxRarityCount = Math.max(1, ...Object.values(rarityMap));

  return (
    <div className="min-h-screen bg-gray-50">
      {profile?.welcomed === false && <WelcomeModal />}
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* 웰컴 배너 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-700 to-purple-800 rounded-2xl p-7 text-white">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute right-12 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative">
            <p className="text-sm text-violet-200 mb-1">안녕하세요 👋</p>
            <h2 className="text-2xl font-bold mb-4">{displayName}님의 카드 유니버스</h2>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/packs"
                className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
              >
                🎴 팩 뽑기
              </Link>
              <Link
                href="/cards"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                내 컬렉션 보기
              </Link>
            </div>
          </div>
        </div>

        {/* 스탯 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="💰"
            label="보유 코인"
            value={balance.toLocaleString()}
            unit="C"
            color="text-violet-600"
          />
          <StatCard
            icon="🃏"
            label="총 보유 카드"
            value={totalCards.toLocaleString()}
            unit="장"
            color="text-blue-600"
          />
          <StatCard
            icon="🌟"
            label="보유 종류"
            value={uniqueCards.toLocaleString()}
            unit="종"
            color="text-amber-600"
          />
          <StatCard
            icon="🎰"
            label="팩 뽑기 횟수"
            value={pullCount.toLocaleString()}
            unit="회"
            color="text-rose-600"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 최근 뽑은 카드 */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">최근 뽑은 카드</h3>
              <Link href="/cards" className="text-xs text-violet-600 hover:underline font-medium">
                전체 보기
              </Link>
            </div>

            {recentCards.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <div className="text-4xl mb-2">🎴</div>
                <p className="text-sm">아직 뽑은 카드가 없어요</p>
                <Link href="/packs" className="mt-3 text-xs text-violet-600 hover:underline">
                  팩 뽑으러 가기 →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {recentCards.map((card, i) => (
                  <div key={i} className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400"} flex items-center justify-center`}>
                        <span className="text-white text-xs font-black opacity-60">{card.rarity}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-1 inset-x-1 text-white text-[9px] font-semibold leading-tight text-center line-clamp-2">
                      {card.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 등급별 보유 현황 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">등급별 보유 현황</h3>
            {totalCards === 0 ? (
              <div className="flex flex-col items-center py-6 text-gray-400">
                <p className="text-sm">카드가 없어요</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {RARITY_ORDER.map((rarity) => {
                  const count = rarityMap[rarity] ?? 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / maxRarityCount) * 100);
                  return (
                    <div key={rarity}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{RARITY_LABEL[rarity]}</span>
                        <span className="text-gray-400">{count}장</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${RARITY_BAR[rarity] ?? "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 최근 뽑기 기록 */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">최근 뽑기 기록</h3>
            {(purchases ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">뽑기 기록이 없어요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(purchases ?? []).map((p) => {
                  const pack = p.packs as unknown as { name: string } | null;
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-sm">
                          🎴
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{pack?.name ?? "팩"}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(p.purchased_at).toLocaleDateString("ko-KR", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-violet-600">−{p.cost.toLocaleString()} C</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 빠른 메뉴 + 계정 정보 */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">빠른 메뉴</h3>
              <div className="space-y-1">
                <QuickAction href="/packs"   icon="🎴" label="팩 뽑기"      desc="팩을 열어 카드 획득" />
                <QuickAction href="/cards"   icon="🃏" label="내 컬렉션"    desc="보유 카드 확인·정리" />
                <QuickAction href="/market"  icon="🏪" label="마켓플레이스" desc="카드 사고팔기" />
                <QuickAction href="/profile" icon="👤" label="내 프로필"    desc="닉네임·아바타 편집" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">계정 정보</h3>
              <InfoRow label="이메일" value={user.email ?? ""} />
              <InfoRow label="가입일" value={new Date(user.created_at).toLocaleDateString("ko-KR")} />
              <InfoRow label="닉네임" value={profile?.nickname ?? "미설정"} />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>
        {value} <span className="text-base font-medium text-gray-400">{unit}</span>
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, desc }: {
  href: string; icon: string; label: string; desc: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className="w-9 h-9 bg-gray-100 group-hover:bg-violet-100 rounded-lg flex items-center justify-center text-lg transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 truncate max-w-[150px]">{value}</span>
    </div>
  );
}
