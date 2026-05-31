import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Pack = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cards_per_pack: number;
  image_url: string | null;
};

type RecentCard = {
  id: string;
  name: string;
  rarity: string;
  image_url: string | null;
};

const RARITY_GLOW: Record<string, string> = {
  N:   "",
  R:   "drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]",
  RR:  "drop-shadow-[0_0_10px_rgba(167,139,250,0.7)]",
  AR:  "drop-shadow-[0_0_10px_rgba(251,113,133,0.7)]",
  SR:  "drop-shadow-[0_0_12px_rgba(251,146,60,0.7)]",
  SAR: "drop-shadow-[0_0_14px_rgba(251,191,36,0.8)]",
  UR:  "drop-shadow-[0_0_18px_rgba(253,224,71,1)]",
  MUR: "drop-shadow-[0_0_24px_rgba(255,255,255,1)]",
};

const RARITY_FALLBACK: Record<string, string> = {
  N:   "from-gray-600 to-gray-700",
  R:   "from-blue-500 to-blue-700",
  RR:  "from-violet-500 to-violet-800",
  AR:  "from-rose-500 to-rose-700",
  SR:  "from-orange-500 to-orange-700",
  SAR: "from-amber-400 to-amber-600",
  UR:  "from-yellow-400 to-amber-500",
  MUR: "from-yellow-300 via-amber-400 to-orange-400",
};

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: packsData }, { data: userData }] = await Promise.all([
    supabase.from("packs").select("id, name, description, price, cards_per_pack, image_url").limit(6),
    supabase.auth.getUser(),
  ]);

  const packs = packsData ?? [];
  const user = userData?.user ?? null;

  let profile: { nickname: string; balance: number } | null = null;
  let recentCards: RecentCard[] = [];

  if (user) {
    const [{ data: profileData }, { data: cardData }] = await Promise.all([
      supabase.from("profiles").select("nickname, balance").eq("id", user.id).single(),
      supabase
        .from("user_cards")
        .select("cards(id, name, rarity, image_url)")
        .eq("user_id", user.id)
        .order("acquired_at", { ascending: false })
        .limit(6),
    ]);
    profile = profileData;
    recentCards = (cardData ?? [])
      .map((uc) => uc.cards as unknown as RecentCard)
      .filter(Boolean);
  }

  const displayName = profile?.nickname ?? user?.email?.split("@")[0] ?? "";
  const balance = profile?.balance ?? 0;

  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#07070f]/90 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-tight">
          <span className="text-amber-400">어인섬</span>
          <span className="text-white/80"> 카드샵</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/packs" className="hover:text-white transition-colors">팩뽑기</Link>
          <Link href="/cards" className="hover:text-white transition-colors">내카드</Link>
          <Link href="/market" className="hover:text-white transition-colors">마켓</Link>
          {user && (
            <Link href="/dashboard" className="hover:text-white transition-colors">대시보드</Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-amber-400">{balance.toLocaleString()} C</span>
              <Link href="/dashboard" className="text-sm bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg transition-colors font-bold">
                {displayName}
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
                로그인
              </Link>
              <Link href="/signup" className="text-sm bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg transition-colors font-bold">
                시작하기
              </Link>
            </>
          )}
        </div>
      </nav>

      {user ? (
        /* ════════════ 로그인 상태 ════════════ */
        <>
          {/* ── 로그인 Hero ── */}
          <section className="relative pt-16 min-h-[45vh] flex flex-col items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>
            <div className="relative max-w-3xl mx-auto px-6 py-16">
              <p className="text-sm text-gray-500 mb-2">안녕하세요 👋</p>
              <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4 tracking-tighter">
                <span className="text-amber-400">{displayName}</span>님의 카드샵
              </h1>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-amber-400 font-black text-lg">{balance.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">코인 보유</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/packs" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-amber-900/30">
                  🎴 팩 뽑기
                </Link>
                <Link href="/cards" className="px-6 py-3 text-gray-300 hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-colors text-sm">
                  내 컬렉션
                </Link>
                <Link href="/market" className="px-6 py-3 text-gray-300 hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-colors text-sm">
                  마켓
                </Link>
              </div>
            </div>
          </section>

          {/* ── 최근 뽑은 카드 ── */}
          {recentCards.length > 0 && (
            <section className="py-12 border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">RECENT CARDS</p>
                    <h2 className="text-xl font-bold">최근 뽑은 카드</h2>
                  </div>
                  <Link href="/cards" className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {recentCards.map((card, i) => (
                    <Link key={i} href="/cards" className={`relative aspect-[2/3] rounded-xl overflow-hidden group ${RARITY_GLOW[card.rarity] ?? ""}`}>
                      {card.image_url ? (
                        <img src={card.image_url} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[card.rarity] ?? "from-gray-600 to-gray-700"} flex items-center justify-center`}>
                          <span className="text-white text-xs font-black opacity-60">{card.rarity}</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                      <p className="absolute bottom-1 inset-x-1 text-white text-[9px] font-semibold text-center leading-tight line-clamp-2">{card.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 팩 목록 (로그인) ── */}
          {packs.length > 0 && (
            <section className="py-12 border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">PACK SHOP</p>
                    <h2 className="text-xl font-bold">최신 팩</h2>
                  </div>
                  <Link href="/packs" className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {packs.map((pack) => (
                    <LoggedInPackCard key={pack.id} pack={pack} balance={balance} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        /* ════════════ 비로그인 상태 ════════════ */
        <>
          {/* ── Hero ── */}
          <section className="relative pt-16 min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
            </div>
            <div className="relative max-w-3xl mx-auto px-6 py-20">
              <div className="inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                SOOP 시청으로 코인을 모아 팩을 뽑아보세요
              </div>
              <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tighter">
                나만의{" "}
                <span className="text-amber-400">TCG</span>
                <br />
                컬렉션을 완성하세요
              </h1>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-xl mx-auto">
                SOOP을 시청하면 코인을 얻고, 코인으로 팩을 뽑아 희귀 카드를 수집하세요.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/signup" className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-900/30 text-sm">
                  무료로 시작하기 →
                </Link>
                <Link href="/login" className="px-8 py-3.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-colors text-sm">
                  로그인
                </Link>
              </div>
            </div>
          </section>

          {/* ── Pack Catalog ── */}
          {packs.length > 0 && (
            <section className="py-16 border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">PACK SHOP</p>
                    <h2 className="text-2xl font-bold">최신 팩</h2>
                  </div>
                  <Link href="/packs" className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {packs.map((pack) => (
                    <GuestPackCard key={pack.id} pack={pack} />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link href="/signup" className="inline-block px-8 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 font-semibold rounded-xl transition-all text-sm">
                    가입하고 팩 뽑기 시작하기 →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ── How to earn ── */}
          <section className="py-20 border-t border-white/5">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-12">
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">HOW IT WORKS</p>
                <h2 className="text-2xl font-bold">이렇게 코인을 모으세요</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <StepCard num="01" icon="📺" title="SOOP 시청" desc="크롬 확장프로그램을 설치하고 SOOP에서 좋아하는 스트리머를 시청하세요. 10분 = 1,000코인." />
                <StepCard num="02" icon="🪙" title="코인 적립"  desc="시청 시간에 비례해 자동으로 코인이 적립됩니다. 잔액은 대시보드에서 실시간으로 확인할 수 있어요." />
                <StepCard num="03" icon="🎴" title="팩 뽑기"   desc="모은 코인으로 팩을 구매하고 N부터 MUR까지 다양한 레어도의 카드를 수집하세요." />
              </div>
            </div>
          </section>

          {/* ── Rarity showcase ── */}
          <section className="py-16 border-t border-white/5 bg-white/[0.01]">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">CARD RARITY</p>
                <h2 className="text-2xl font-bold">레어도 시스템</h2>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {RARITIES.map((r) => (
                  <div key={r.code} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${r.cls}`}>
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-600 mt-6">
                낮은 확률일수록 화려한 등장 애니메이션과 특수 이펙트가 적용됩니다
              </p>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-24 relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-2xl mx-auto text-center px-6">
              <h2 className="text-4xl lg:text-5xl font-black mb-5 leading-tight tracking-tighter">
                지금 바로<br />
                <span className="text-amber-400">첫 팩을 뽑아보세요</span>
              </h2>
              <p className="text-gray-400 mb-10">무료로 가입하고 SOOP 확장프로그램을 설치하면 바로 코인 적립 시작</p>
              <Link href="/signup" className="inline-block px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-2xl shadow-amber-900/30 text-base">
                무료로 시작하기 →
              </Link>
            </div>
          </section>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <span className="font-bold text-gray-500">어인섬 카드샵</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">개인정보처리방침</Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── 로그인 상태 팩 카드 ── */
function LoggedInPackCard({ pack, balance }: { pack: Pack; balance: number }) {
  const canAfford = balance >= pack.price;
  return (
    <Link href="/packs" className="block group relative overflow-hidden rounded-2xl aspect-[3/4]">
      {pack.image_url ? (
        <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-violet-900/30 flex items-center justify-center">
          <span className="text-7xl opacity-20">📦</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 gap-1.5">
        <h3 className="text-sm font-bold text-white leading-tight">{pack.name}</h3>
        <div className="flex items-center justify-between">
          <span className={`text-base font-black ${canAfford ? "text-amber-400" : "text-gray-500"}`}>
            {pack.price.toLocaleString()} C
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${canAfford ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-gray-500"}`}>
            {canAfford ? "구매 가능" : "코인 부족"}
          </span>
        </div>
      </div>
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-xs text-gray-300 px-2 py-0.5 rounded-md">
        {pack.cards_per_pack}장
      </div>
    </Link>
  );
}

/* ── 비로그인 팩 카드 ── */
function GuestPackCard({ pack }: { pack: Pack }) {
  return (
    <Link href="/signup" className="block group relative overflow-hidden rounded-2xl aspect-[3/4]">
      {pack.image_url ? (
        <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-violet-900/30 flex items-center justify-center">
          <span className="text-7xl opacity-20">📦</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 gap-1.5">
        <h3 className="text-sm font-bold text-white leading-tight">{pack.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-black text-amber-400">{pack.price.toLocaleString()} C</span>
          <span className="text-xs text-gray-400 bg-black/40 px-2 py-0.5 rounded-md">{pack.cards_per_pack}장</span>
        </div>
      </div>
    </Link>
  );
}

/* ── 단계 카드 ── */
function StepCard({ num, icon, title, desc }: { num: string; icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-4xl font-black text-white/5 leading-none mt-1">{num}</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── 레어도 데이터 ── */
const RARITIES = [
  { code: "N",   label: "N",        cls: "bg-gray-800/60 border-gray-700/50 text-gray-300" },
  { code: "R",   label: "R ★",      cls: "bg-blue-900/30 border-blue-500/30 text-blue-300" },
  { code: "RR",  label: "RR ★★",    cls: "bg-violet-900/30 border-violet-500/30 text-violet-300" },
  { code: "AR",  label: "AR ✦",     cls: "bg-rose-900/30 border-rose-500/30 text-rose-300" },
  { code: "SR",  label: "SR ✦✦",    cls: "bg-orange-900/30 border-orange-500/30 text-orange-300" },
  { code: "SAR", label: "SAR ✦✦✦",  cls: "bg-amber-900/30 border-amber-400/40 text-amber-300" },
  { code: "UR",  label: "UR ✦✦✦✦",  cls: "bg-yellow-900/30 border-yellow-300/40 text-yellow-200" },
  { code: "MUR", label: "MUR 👑",   cls: "bg-gradient-to-r from-pink-900/30 to-purple-900/30 border-yellow-300/50 text-white" },
];
