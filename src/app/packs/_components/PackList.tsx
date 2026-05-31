"use client";

import { useState, useRef, useEffect } from "react";
import { buyPack, type PulledCard } from "../actions";

type Pack = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cards_per_pack: number;
  image_url: string | null;
};

type Rarity = "N" | "R" | "RR" | "AR" | "SR" | "SAR" | "UR" | "MUR";

const RARITY_LABEL: Record<Rarity, string> = {
  N:   "N",
  R:   "R ★",
  RR:  "RR ★★",
  AR:  "AR ✦",
  SR:  "SR ✦✦",
  SAR: "SAR ✦✦✦",
  UR:  "UR ✦✦✦✦",
  MUR: "MUR 👑",
};

const TYPE_STYLE: Record<string, { bg: string; emoji: string }> = {
  fire:      { bg: "from-red-500 via-orange-500 to-yellow-500",    emoji: "🔥" },
  water:     { bg: "from-blue-400 via-cyan-500 to-blue-600",       emoji: "💧" },
  grass:     { bg: "from-green-400 via-emerald-500 to-teal-500",   emoji: "🌿" },
  lightning: { bg: "from-yellow-300 via-amber-400 to-orange-400",  emoji: "⚡" },
  psychic:   { bg: "from-pink-400 via-fuchsia-500 to-purple-500",  emoji: "🔮" },
  dark:      { bg: "from-gray-700 via-slate-800 to-purple-900",    emoji: "🌑" },
  metal:     { bg: "from-gray-400 via-slate-500 to-zinc-600",      emoji: "⚙️" },
  dragon:    { bg: "from-indigo-500 via-violet-600 to-purple-700", emoji: "🐉" },
  normal:    { bg: "from-stone-400 via-amber-500 to-yellow-600",   emoji: "⭐" },
  default:   { bg: "from-violet-500 via-purple-600 to-indigo-700", emoji: "✨" },
};

const RARITY_BADGE_DARK: Record<string, string> = {
  N:   "bg-gray-600/60 text-gray-200",
  R:   "bg-blue-500/50 text-blue-200",
  RR:  "bg-violet-500/50 text-violet-200",
  AR:  "bg-rose-500/50 text-rose-200",
  SR:  "bg-orange-500/50 text-orange-200",
  SAR: "bg-amber-500/50 text-amber-200",
  UR:  "bg-yellow-400/40 text-yellow-200",
  MUR: "bg-gradient-to-r from-yellow-400/50 to-pink-500/50 text-white",
};

const RARITY_BORDER: Record<Rarity, string> = {
  N:   "border-gray-500/40",
  R:   "border-blue-400/60",
  RR:  "border-violet-400/70",
  AR:  "border-rose-400/70",
  SR:  "border-orange-400/70",
  SAR: "border-amber-400/80",
  UR:  "border-yellow-300",
  MUR: "border-yellow-200",
};

const RARITY_GLOW: Record<Rarity, string> = {
  N:   "",
  R:   "drop-shadow-[0_0_14px_rgba(96,165,250,0.7)]",
  RR:  "drop-shadow-[0_0_20px_rgba(167,139,250,0.8)]",
  AR:  "drop-shadow-[0_0_22px_rgba(251,113,133,0.8)]",
  SR:  "drop-shadow-[0_0_24px_rgba(251,146,60,0.8)]",
  SAR: "drop-shadow-[0_0_28px_rgba(251,191,36,0.9)]",
  UR:  "drop-shadow-[0_0_36px_rgba(253,224,71,1)]",
  MUR: "drop-shadow-[0_0_48px_rgba(255,255,255,1)]",
};

type Phase =
  | { type: "list" }
  | { type: "loading"; packName: string }
  | { type: "reveal"; cards: PulledCard[]; currentIndex: number; flipped: boolean; pack: Pack }
  | { type: "n-reveal"; cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "r-reveal";  cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "rr-reveal"; cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "sr-reveal";  cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "sar-reveal"; cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "ur-reveal";  cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "mur-reveal"; cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "ar-reveal";  cards: PulledCard[]; currentIndex: number; pack: Pack }
  | { type: "done"; cards: PulledCard[]; pack: Pack };

type AnimConfig = { name: string; duration: string; easing: string };

const RARITY_ANIM: Record<string, AnimConfig> = {
  N:   { name: "reveal-n",   duration: "0.32s", easing: "cubic-bezier(0.34,1.3,0.64,1)" },
  R:   { name: "reveal-r",   duration: "0.44s", easing: "cubic-bezier(0.34,1.3,0.64,1)" },
  RR:  { name: "reveal-rr",  duration: "0.54s", easing: "cubic-bezier(0.34,1.4,0.64,1)" },
  AR:  { name: "reveal-ar",  duration: "0.60s", easing: "cubic-bezier(0.34,1.5,0.64,1)" },
  SR:  { name: "reveal-sr",  duration: "0.65s", easing: "cubic-bezier(0.34,1.6,0.64,1)" },
  SAR: { name: "reveal-sar", duration: "0.75s", easing: "cubic-bezier(0.34,1.5,0.64,1)" },
  UR:  { name: "reveal-ur",  duration: "0.90s", easing: "cubic-bezier(0.34,1.4,0.64,1)" },
  MUR: { name: "reveal-mur", duration: "2.4s",  easing: "linear" },
};

const DEFAULT_ANIM: AnimConfig = { name: "reveal-n", duration: "0.32s", easing: "cubic-bezier(0.34,1.3,0.64,1)" };

const RARITY_FLASH: Record<string, string> = {
  SAR: "rgba(251,191,36,0.35)",
  UR:  "rgba(253,224,71,0.45)",
  MUR: "rgba(255,255,255,0.75)",
};

export default function PackList({ packs, balance, cardCount }: { packs: Pack[]; balance: number; cardCount: number }) {
  const [phase, setPhase] = useState<Phase>({ type: "list" });
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [zoomedCard, setZoomedCard] = useState<PulledCard | null>(null);
  const animWrapperRef = useRef<HTMLDivElement>(null);

  // 카드 변경/뒤집기 시 등급별 애니메이션을 직접 재시작
  useEffect(() => {
    const el = animWrapperRef.current;
    if (!el || phase.type !== "reveal") return;

    const { currentIndex, flipped, cards } = phase;
    const rarity = cards[currentIndex].card.rarity;

    const cfg = flipped
      ? (RARITY_ANIM[rarity] ?? DEFAULT_ANIM)
      : DEFAULT_ANIM;

    // animation 강제 재시작 (reflow trick)
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = `${cfg.name} ${cfg.duration} ${cfg.easing} both`;
  }, [phase]);

  function triggerFlash(rarity: string) {
    const color = RARITY_FLASH[rarity];
    if (!color) return;
    if (rarity === "MUR") {
      // MUR: 애니메이션 중간(28%)에 맞춰 플래시 — 2.4s * 0.38 ≈ 910ms 지점
      setTimeout(() => {
        setFlash(color);
        setTimeout(() => setFlash(null), 700);
      }, 680);
    } else {
      setFlash(color);
      setTimeout(() => setFlash(null), 600);
    }
  }

  async function handleBuy(pack: Pack) {
    setError(null);
    setPhase({ type: "loading", packName: pack.name });

    const result = await buyPack(pack.id);
    if (!result.success) {
      setError(result.error);
      setPhase({ type: "list" });
      return;
    }

    setPhase({ type: "reveal", cards: result.cards, currentIndex: 0, flipped: false, pack });
  }

  function flipCurrent() {
    if (phase.type !== "reveal" || phase.flipped) return;
    const rarity = phase.cards[phase.currentIndex].card.rarity;
    if (rarity === "N") {
      setPhase({ type: "n-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "R") {
      setPhase({ type: "r-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "RR") {
      setPhase({ type: "rr-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "SR") {
      setPhase({ type: "sr-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "SAR") {
      setPhase({ type: "sar-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "UR") {
      setPhase({ type: "ur-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "MUR") {
      setPhase({ type: "mur-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    if (rarity === "AR") {
      setPhase({ type: "ar-reveal", cards: phase.cards, currentIndex: phase.currentIndex, pack: phase.pack });
      return;
    }
    triggerFlash(rarity);
    setPhase({ ...phase, flipped: true });
  }

  function handleNDone() {
    if (phase.type !== "n-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleRDone() {
    if (phase.type !== "r-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleRRDone() {
    if (phase.type !== "rr-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleSRDone() {
    if (phase.type !== "sr-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleSARDone() {
    if (phase.type !== "sar-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleURDone() {
    if (phase.type !== "ur-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleMURDone() {
    if (phase.type !== "mur-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function handleARDone() {
    if (phase.type !== "ar-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: false, pack: phase.pack });
    }
  }

  function nextCard() {
    if (phase.type !== "reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    } else {
      setPhase({ ...phase, currentIndex: next, flipped: false });
    }
  }

  function skipAll() {
    if (phase.type === "reveal") setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "n-reveal") setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "r-reveal")  setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "rr-reveal") setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "sr-reveal")  setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "sar-reveal") setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "ur-reveal")  setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "mur-reveal") setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
    else if (phase.type === "ar-reveal")  setPhase({ type: "done", cards: phase.cards, pack: phase.pack });
  }

  /* ── 로딩 ── */
  if (phase.type === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{phase.packName} 개봉 중...</p>
      </div>
    );
  }

  /* ── N 리빌 ── */
  if (phase.type === "n-reveal") {
    return <NRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleNDone} />;
  }

  /* ── R 리빌 ── */
  if (phase.type === "r-reveal") {
    return <RRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleRDone} />;
  }

  /* ── RR 리빌 ── */
  if (phase.type === "rr-reveal") {
    return <RRRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleRRDone} />;
  }

  /* ── SR 리빌 ── */
  if (phase.type === "sr-reveal") {
    return <SRRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleSRDone} />;
  }

  /* ── SAR 리빌 ── */
  if (phase.type === "sar-reveal") {
    return <SARRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleSARDone} />;
  }

  /* ── UR 리빌 ── */
  if (phase.type === "ur-reveal") {
    return <URRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleURDone} />;
  }

  /* ── MUR 리빌 ── */
  if (phase.type === "mur-reveal") {
    return <MURRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleMURDone} />;
  }

  /* ── AR 시네마틱 ── */
  if (phase.type === "ar-reveal") {
    return <ARRevealAnimation pulled={phase.cards[phase.currentIndex]} onDone={handleARDone} />;
  }

  /* ── 한 장씩 리빌 ── */
  if (phase.type === "reveal") {
    const current = phase.cards[phase.currentIndex];
    const isLast = phase.currentIndex === phase.cards.length - 1;
    const rarity = current.card.rarity;

    return (
      <div className="flex flex-col items-center gap-6 py-6 min-h-[70vh] relative">
        {/* 화면 플래시 오버레이 */}
        {flash && (
          <div
            className="screen-flash fixed inset-0 pointer-events-none z-50"
            style={{ background: flash }}
          />
        )}

        {/* 진행 표시 */}
        <div className="flex items-center gap-2">
          {phase.cards.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < phase.currentIndex
                  ? "w-6 bg-violet-500"
                  : i === phase.currentIndex
                  ? "w-8 bg-violet-400"
                  : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>

        <p className="text-gray-500 text-xs h-4">
          {!phase.flipped && "카드를 클릭해서 열어보세요"}
        </p>

        {/* 큰 카드 — ref로 애니메이션 직접 제어 */}
        <div ref={animWrapperRef}>
          <div key={phase.currentIndex}>
            <BigFlipCard
              pulled={current}
              isFlipped={phase.flipped}
              onClick={phase.flipped ? nextCard : flipCurrent}
            />
          </div>
        </div>

        {/* 레어도 배지 */}
        {phase.flipped && (
          <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${RARITY_BORDER[rarity as Rarity] ?? "border-white/20"} bg-white/5 text-white`}>
            {RARITY_LABEL[rarity as Rarity] ?? rarity}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {phase.flipped && (
            <button
              onClick={nextCard}
              className="px-7 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-violet-900/40"
            >
              {isLast ? "결과 보기" : "다음 카드 →"}
            </button>
          )}
          <button
            onClick={skipAll}
            className="px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-2xl border border-white/10 transition-colors"
          >
            전부 건너뛰기
          </button>
        </div>
      </div>
    );
  }

  /* ── 결과 요약 ── */
  if (phase.type === "done") {
    return (
      <div className="flex flex-col items-center gap-6">
        {zoomedCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setZoomedCard(null)}
          >
            <div className="relative max-h-[90vh] aspect-[2/3]" onClick={(e) => e.stopPropagation()}>
              {zoomedCard.card.image_url ? (
                <img
                  src={zoomedCard.card.image_url}
                  alt={zoomedCard.card.name}
                  className={`h-full w-full object-cover rounded-2xl shadow-2xl ${RARITY_GLOW[zoomedCard.card.rarity as Rarity]}`}
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${(TYPE_STYLE[zoomedCard.card.card_type ?? "default"] ?? TYPE_STYLE.default).bg} rounded-2xl flex items-center justify-center`}>
                  <span className="text-white text-6xl font-black opacity-60">{zoomedCard.card.rarity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-gray-400 text-sm font-medium">뽑기 결과</p>

        {/* 카드 썸네일 그리드 */}
        <div className="flex flex-wrap justify-center gap-3">
          {phase.cards.map((pc) => {
            const rarity = pc.card.rarity as Rarity;
            const typeStyle = TYPE_STYLE[pc.card.card_type ?? "default"] ?? TYPE_STYLE.default;
            return (
              <div key={pc.userCardId} className="flex flex-col items-center gap-1">
                <div
                  className={`relative w-20 h-[112px] rounded-xl overflow-hidden shadow-lg cursor-zoom-in hover:scale-105 transition-transform duration-150 ${RARITY_GLOW[rarity]}`}
                  onClick={() => setZoomedCard(pc)}
                >
                  {pc.card.image_url ? (
                    <img src={pc.card.image_url} alt={pc.card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center gap-1`}>
                      <span className="text-xl">{typeStyle.emoji}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${RARITY_BADGE_DARK[rarity] ?? RARITY_BADGE_DARK.N}`}>
                  {rarity}
                </span>
                <p className="text-[10px] text-white/80 font-medium text-center leading-tight w-20 line-clamp-2">{pc.card.name}</p>
              </div>
            );
          })}
        </div>

        {/* 목록 요약 */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-3">획득한 카드</p>
          <div className="space-y-2">
            {phase.cards.map((pc) => {
              const rarity = pc.card.rarity as Rarity;
              return (
                <div key={pc.userCardId} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white font-medium truncate">{pc.card.name}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${RARITY_BADGE_DARK[rarity] ?? RARITY_BADGE_DARK.N}`}>
                    {RARITY_LABEL[rarity] ?? rarity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleBuy(phase.pack)}
            className="px-7 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-violet-900/40"
          >
            🎴 다시 뽑기
          </button>
          <button
            onClick={() => setPhase({ type: "list" })}
            className="px-7 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-2xl border border-white/10 transition-colors"
          >
            팩 목록으로
          </button>
        </div>
      </div>
    );
  }

  /* ── 팩 목록 ── */
  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          ⚠ {error}
        </div>
      )}

      {cardCount >= 1000 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
          <span className="text-xl">🚫</span>
          <div>
            <p className="font-semibold">카드 보유 한도({cardCount}/1000장)에 도달했습니다</p>
            <p className="text-xs text-red-400/70 mt-0.5">내 컬렉션에서 카드를 즉시판매하면 뽑기가 가능합니다</p>
          </div>
        </div>
      )}

      {packs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-sm">판매 중인 팩이 없습니다</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} balance={balance} cardCount={cardCount} onBuy={() => handleBuy(pack)} />
          ))}
        </div>
      )}

    </div>
  );
}

/* ── 팩 카드 컴포넌트 ── */
function PackCard({ pack, balance, cardCount, onBuy }: { pack: Pack; balance: number; cardCount: number; onBuy: () => void }) {
  const canAfford = balance >= pack.price;
  const atLimit = cardCount >= 1000;

  return (
    <div className="overflow-hidden bg-gradient-to-b from-violet-900/30 to-purple-950/60 rounded-2xl transition-all group flex flex-col">
      {/* 메인 이미지 영역 */}
      <div className="relative w-full h-80 overflow-hidden rounded-t-2xl bg-violet-900/20 flex-shrink-0">
        {pack.image_url ? (
          <img
            src={pack.image_url}
            alt={pack.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-20">📦</span>
          </div>
        )}
        {/* 하단 그라디언트 페이드 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0818] via-transparent to-transparent" />
        {/* 카드 수 뱃지 */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-xs text-gray-300 px-2.5 py-1 rounded-lg border border-white/10">
          {pack.cards_per_pack}장
        </div>
      </div>

      {/* 팩 정보 */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{pack.name}</h3>
          {pack.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pack.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-bold text-amber-400">{pack.price.toLocaleString()} C</span>
          <button
            onClick={onBuy}
            disabled={!canAfford || atLimit}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              atLimit
                ? "bg-red-900/30 text-red-400 cursor-not-allowed"
                : canAfford
                  ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {atLimit ? "한도 초과" : canAfford ? "뽑기" : "코인 부족"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 큰 카드 뒤집기 컴포넌트 ── */
function BigFlipCard({
  pulled,
  isFlipped,
  onClick,
}: {
  pulled: PulledCard;
  isFlipped: boolean;
  onClick: () => void;
}) {
  const rarity = pulled.card.rarity as Rarity;
  const typeStyle = TYPE_STYLE[pulled.card.card_type ?? "default"] ?? TYPE_STYLE.default;

  return (
    <div
      style={{ perspective: "1200px" }}
      onClick={onClick}
      className="w-[260px] h-[364px] sm:w-[300px] sm:h-[420px] cursor-pointer"
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        className="relative w-full h-full"
      >
        {/* 카드 뒷면 */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="rounded-3xl bg-gradient-to-br from-violet-900 to-purple-950 border border-violet-500/20 flex flex-col items-center justify-center gap-4 shadow-2xl select-none"
        >
          <div className="w-20 h-20 rounded-2xl bg-violet-800/40 border border-violet-500/20 flex items-center justify-center">
            <span className="text-4xl opacity-70">🃏</span>
          </div>
          <p className="text-violet-400/50 font-black tracking-[0.3em] text-sm">TCG</p>
          <p className="text-violet-500/30 text-xs">탭하여 열기</p>
        </div>

        {/* 카드 앞면 — 순수 이미지 */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
          className={`rounded-3xl overflow-hidden shadow-2xl ${RARITY_GLOW[rarity] ?? ""}`}
        >
          {pulled.card.image_url ? (
            <img
              src={pulled.card.image_url}
              alt={pulled.card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            /* 이미지 없을 때 폴백 */
            <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col`}>
              {["R", "RR", "AR", "SR", "SAR", "UR", "MUR"].includes(rarity) && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0 animate-pulse" />
              )}
              <div className="flex-1 flex items-center justify-center relative">
                <span className="text-8xl">{typeStyle.emoji}</span>
              </div>
              <div className="relative px-5 pb-5">
                <p className="text-white font-black text-xl leading-tight">{pulled.card.name}</p>
                <p className="text-white/60 text-sm mt-0.5">{RARITY_LABEL[rarity] ?? rarity}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── N 등급 리빌 애니메이션 ─────────────── */
const N_KEYFRAMES = `
@keyframes nBgFade {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes nSilhouette {
  0%   { transform: scale(0.82); filter: brightness(0) saturate(0); opacity: 0; }
  20%  { transform: scale(0.88); filter: brightness(0) saturate(0); opacity: 1; }
  55%  { transform: scale(1.04); filter: brightness(0) saturate(0); opacity: 1; }
  100% { transform: scale(1);    filter: brightness(1) saturate(1); opacity: 1; }
}
`;

function NRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const typeStyle = TYPE_STYLE[pulled.card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = setTimeout(onDone, 750);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{N_KEYFRAMES}</style>

      {/* 암전 배경 */}
      <div
        className="absolute inset-0 bg-black"
        style={{ animation: "nBgFade 0.75s ease forwards" }}
      />

      {/* 카드 — 실루엣→공개 */}
      <div
        className="relative w-[220px] h-[308px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: "nSilhouette 0.75s cubic-bezier(0.4,0,0.2,1) forwards" }}
      >
        {pulled.card.image_url ? (
          <img src={pulled.card.image_url} alt={pulled.card.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
            <span className="text-6xl">{typeStyle.emoji}</span>
            <p className="text-white text-sm font-bold mt-2 px-3 text-center">{pulled.card.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── R 등급 리빌 애니메이션 ─────────────── */
const R_KEYFRAMES = `
@keyframes rCardEnter {
  0%   { transform: scale(0.78) translateY(24px); opacity: 0; }
  60%  { transform: scale(1.04) translateY(-4px); opacity: 1; }
  100% { transform: scale(1)    translateY(0);    opacity: 1; }
}
@keyframes rShine {
  0%   { transform: translateX(-110%) skewX(-18deg); opacity: 0; }
  15%  { opacity: 0.9; }
  85%  { opacity: 0.9; }
  100% { transform: translateX(260%)  skewX(-18deg); opacity: 0; }
}
@keyframes rParticle {
  0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
  100% { transform: translate(var(--px), var(--py)) scale(0); opacity: 0; }
}
@keyframes rGlow {
  0%, 100% { box-shadow: 0 0 12px 2px rgba(96,165,250,0.3); }
  50%       { box-shadow: 0 0 28px 6px rgba(96,165,250,0.7); }
}
`;

const R_PARTICLES = [
  { x: "-38px", y: "-52px" }, { x: "40px",  y: "-60px" },
  { x: "-60px", y: "10px"  }, { x: "62px",  y: "14px"  },
  { x: "-28px", y: "56px"  }, { x: "32px",  y: "58px"  },
];

function RRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const typeStyle = TYPE_STYLE[pulled.card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = setTimeout(onDone, 1050);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <style>{R_KEYFRAMES}</style>

      {/* 카드 */}
      <div
        className="relative w-[230px] h-[322px] rounded-2xl overflow-hidden"
        style={{
          animation: "rCardEnter 0.45s cubic-bezier(0.34,1.3,0.64,1) forwards, rGlow 0.8s ease-in-out 0.45s infinite",
        }}
      >
        {pulled.card.image_url ? (
          <img src={pulled.card.image_url} alt={pulled.card.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
            <span className="text-6xl">{typeStyle.emoji}</span>
            <p className="text-white text-sm font-bold mt-2 px-3 text-center">{pulled.card.name}</p>
          </div>
        )}

        {/* 빛 스캔 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(147,197,253,0.6) 50%, transparent 65%)",
            animation: "rShine 0.55s ease-in-out 0.38s forwards",
            transform: "translateX(-110%) skewX(-18deg)",
          }}
        />
      </div>

      {/* 파티클 */}
      {R_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-300 pointer-events-none"
          style={{
            ["--px" as string]: p.x,
            ["--py" as string]: p.y,
            animation: `rParticle 0.55s ease-out ${0.38 + i * 0.04}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* 등급 뱃지 */}
      <div
        className="absolute bottom-[calc(50%-220px)] text-blue-300 text-xs font-bold tracking-widest"
        style={{ animation: "rCardEnter 0.4s ease 0.6s both" }}
      >
        R ★
      </div>
    </div>
  );
}

/* ─────────────── RR 등급 리빌 애니메이션 ─────────────── */
const RR_KEYFRAMES = `
@keyframes rrBgPulse {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 1; }
}
@keyframes rrBackGlow {
  0%   { transform: scale(0.2); opacity: 0; filter: blur(60px); }
  50%  { transform: scale(1.1); opacity: 1; filter: blur(30px); }
  100% { transform: scale(1);   opacity: 0.85; filter: blur(24px); }
}
@keyframes rrCardSpin {
  0%   { transform: perspective(900px) rotateY(90deg) scale(0.85); opacity: 0; }
  30%  { opacity: 1; }
  70%  { transform: perspective(900px) rotateY(-10deg) scale(1.1); opacity: 1; }
  100% { transform: perspective(900px) rotateY(0deg)   scale(1);   opacity: 1; }
}
@keyframes rrBurst {
  0%   { transform: scale(0.1); opacity: 1; }
  60%  { opacity: 0.5; }
  100% { transform: scale(3.2); opacity: 0; }
}
@keyframes rrRay {
  0%   { transform: rotate(var(--angle)) scaleX(0); opacity: 0.8; }
  60%  { opacity: 0.6; }
  100% { transform: rotate(var(--angle)) scaleX(1.4); opacity: 0; }
}
@keyframes rrGlowPulse {
  0%, 100% { box-shadow: 0 0 18px 4px rgba(167,139,250,0.55); }
  50%       { box-shadow: 0 0 52px 14px rgba(167,139,250,0.95); }
}
@keyframes rrBadge {
  0%   { opacity: 0; transform: translateY(12px) scale(0.8); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
`;

const RR_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

function RRRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const typeStyle = TYPE_STYLE[pulled.card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "rrBgPulse 0.4s ease forwards", background: "rgba(10,4,26,0)" }}
    >
      <style>{RR_KEYFRAMES}</style>

      {/* 배경 */}
      <div className="absolute inset-0 bg-[#0a041a]" style={{ animation: "rrBgPulse 0.4s ease forwards" }} />

      {/* 카드 뒤 광원 */}
      <div
        className="absolute w-72 h-72 rounded-full bg-violet-500 pointer-events-none"
        style={{ animation: "rrBackGlow 0.55s cubic-bezier(0.4,0,0.2,1) forwards" }}
      />

      {/* 빛 폭발 링 */}
      <div
        className="absolute w-64 h-64 rounded-full border-2 border-violet-300/70 pointer-events-none"
        style={{ animation: "rrBurst 0.5s ease-out 0.72s forwards", transform: "scale(0.1)", opacity: 0 }}
      />
      <div
        className="absolute w-52 h-52 rounded-full border border-violet-400/50 pointer-events-none"
        style={{ animation: "rrBurst 0.5s ease-out 0.78s forwards", transform: "scale(0.1)", opacity: 0 }}
      />

      {/* 방사 광선 */}
      {RR_RAYS.map((angle, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: "120px",
            height: "2px",
            background: "linear-gradient(to right, rgba(167,139,250,0.9), transparent)",
            transformOrigin: "left center",
            left: "50%",
            top: "50%",
            marginTop: "-1px",
            ["--angle" as string]: `${angle}deg`,
            animation: `rrRay 0.55s ease-out 0.72s forwards`,
            transform: `rotate(${angle}deg) scaleX(0)`,
            opacity: 0,
          }}
        />
      ))}

      {/* 카드 — rotateY 등장 */}
      <div
        className="relative w-[230px] h-[322px] rounded-2xl overflow-hidden"
        style={{
          animation: "rrCardSpin 0.72s cubic-bezier(0.34,1.2,0.64,1) 0.28s both, rrGlowPulse 1s ease-in-out 1s infinite",
        }}
      >
        {pulled.card.image_url ? (
          <img src={pulled.card.image_url} alt={pulled.card.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
            <span className="text-6xl">{typeStyle.emoji}</span>
            <p className="text-white text-sm font-bold mt-2 px-3 text-center">{pulled.card.name}</p>
          </div>
        )}
      </div>

      {/* 등급 뱃지 */}
      <div
        className="absolute bottom-[calc(50%-220px)] text-violet-300 text-xs font-bold tracking-widest"
        style={{ animation: "rrBadge 0.35s ease 1.1s both" }}
      >
        RR ★★
      </div>
    </div>
  );
}

/* ─────────────── MUR 등급 리빌 애니메이션 ─────────────── */
const MUR_KEYFRAMES = `
@keyframes murBgIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes murGlitch {
  0%,100% { filter: blur(0) hue-rotate(0deg);    transform: skewX(0deg) skewY(0deg); }
  10%     { filter: blur(3px) hue-rotate(60deg);  transform: skewX(2.5deg) skewY(0.5deg); clip-path: inset(30% 0 40% 0); }
  20%     { filter: blur(0)   hue-rotate(160deg); transform: skewX(-1.5deg);              clip-path: inset(10% 0 60% 0); }
  30%     { filter: blur(4px) hue-rotate(240deg); transform: skewX(1deg) skewY(-1deg);    clip-path: inset(55% 0 5% 0); }
  50%     { filter: blur(1px) hue-rotate(320deg); transform: skewX(-2deg);                clip-path: none; }
  70%     { filter: blur(2px) hue-rotate(40deg);  transform: skewX(1.5deg) skewY(0.8deg); }
  85%     { filter: blur(0)   hue-rotate(0deg);   transform: skewX(0deg); }
}
@keyframes murGlitchR {
  0%,100% { opacity: 0; transform: translateX(0); }
  20%     { opacity: 0.6; transform: translateX(4px); }
  40%     { opacity: 0;   transform: translateX(0); }
  60%     { opacity: 0.5; transform: translateX(-3px); }
  80%     { opacity: 0; }
}
@keyframes murGlitchB {
  0%,100% { opacity: 0; transform: translateX(0); }
  20%     { opacity: 0.5; transform: translateX(-4px); }
  40%     { opacity: 0; }
  60%     { opacity: 0.4; transform: translateX(3px); }
  80%     { opacity: 0; }
}
@keyframes murStarIn {
  0%   { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes murStarTwinkle {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: 0.2; transform: scale(0.5); }
}
@keyframes murNebulaRotate {
  0%   { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1.05); }
}
@keyframes murShardIn {
  0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)) scale(0.2); opacity: 0; }
  25%  { opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) rotate(var(--er)) scale(1); opacity: 1; }
}
@keyframes murShardPulse {
  0%,100% { box-shadow: 0 0 12px 3px var(--sc); filter: brightness(1); }
  50%      { box-shadow: 0 0 28px 8px var(--sc); filter: brightness(1.5); }
}
@keyframes murCoalesce {
  0%   { transform: translate(var(--tx), var(--ty)) rotate(var(--er)) scale(1); opacity: 1; filter: blur(0); }
  100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; filter: blur(2px); }
}
@keyframes murExplosionRing {
  0%   { transform: scale(0.1); opacity: 1; }
  100% { transform: scale(6); opacity: 0; }
}
@keyframes murExplosionRay {
  0%   { transform: rotate(var(--ang)) scaleX(0); opacity: 0; transform-origin: left center; }
  20%  { opacity: 1; }
  75%  { opacity: 0.8; }
  100% { transform: rotate(var(--ang)) scaleX(1.8); opacity: 0; transform-origin: left center; }
}
@keyframes murCardReveal {
  0%   { transform: scale(0.9); opacity: 0; filter: blur(20px); }
  100% { transform: scale(1);   opacity: 1; filter: blur(0); }
}
@keyframes murCameraOrbit {
  0%   { transform: perspective(1400px) rotateY(0deg)   rotateX(0deg); }
  20%  { transform: perspective(1400px) rotateY(10deg)  rotateX(3deg); }
  50%  { transform: perspective(1400px) rotateY(-10deg) rotateX(-2deg); }
  80%  { transform: perspective(1400px) rotateY(6deg)   rotateX(2deg); }
  100% { transform: perspective(1400px) rotateY(0deg)   rotateX(0deg); }
}
@keyframes murRadiance {
  0%   { box-shadow: 0 0 60px 20px rgba(255,50,50,0.8),   0 0 130px rgba(255,100,0,0.5),  0 0 220px rgba(255,200,0,0.3);  filter: hue-rotate(0deg); }
  16%  { box-shadow: 0 0 60px 20px rgba(255,200,0,0.8),   0 0 130px rgba(100,255,0,0.5),  0 0 220px rgba(0,255,100,0.3);  filter: hue-rotate(60deg); }
  33%  { box-shadow: 0 0 60px 20px rgba(0,255,128,0.8),   0 0 130px rgba(0,200,255,0.5),  0 0 220px rgba(0,100,255,0.3);  filter: hue-rotate(120deg); }
  50%  { box-shadow: 0 0 60px 20px rgba(0,100,255,0.8),   0 0 130px rgba(100,0,255,0.5),  0 0 220px rgba(200,0,255,0.3);  filter: hue-rotate(180deg); }
  66%  { box-shadow: 0 0 60px 20px rgba(200,0,255,0.8),   0 0 130px rgba(255,0,200,0.5),  0 0 220px rgba(255,0,100,0.3);  filter: hue-rotate(240deg); }
  83%  { box-shadow: 0 0 60px 20px rgba(255,0,100,0.8),   0 0 130px rgba(255,50,50,0.5),  0 0 220px rgba(255,100,0,0.3);  filter: hue-rotate(300deg); }
  100% { box-shadow: 0 0 60px 20px rgba(255,50,50,0.8),   0 0 130px rgba(255,100,0,0.5),  0 0 220px rgba(255,200,0,0.3);  filter: hue-rotate(360deg); }
}
@keyframes murHoloRainbow {
  0%   { transform: translateX(-140%) rotate(20deg); opacity: 0; filter: hue-rotate(0deg); }
  15%  { opacity: 0.7; }
  85%  { opacity: 0.7; }
  100% { transform: translateX(240%)  rotate(20deg); opacity: 0; filter: hue-rotate(180deg); }
}
@keyframes murBadgeIn {
  0%   { opacity: 0; transform: scale(0.2) translateY(20px); letter-spacing: 0; filter: blur(14px); }
  60%  { letter-spacing: 0.55em; filter: blur(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 0.48em; }
}
@keyframes murBtnIn {
  0%   { opacity: 0; transform: translateY(24px) scale(0.85); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
`;

const MUR_STARS = Array.from({ length: 90 }, (_, i) => ({
  left:  `${((i * 17.31 + 5.3)  % 100).toFixed(2)}%`,
  top:   `${((i * 23.17 + 11.7) % 100).toFixed(2)}%`,
  size:  (i % 4 === 0) ? 3 : (i % 3 === 0) ? 2 : 1,
  delay: ((i * 0.11) % 2.5).toFixed(2),
  dur:   (1.2 + (i % 5) * 0.4).toFixed(1),
}));

const MUR_SHARDS = [
  { sx:"-44vw", sy:"-36vh", sr:-58, tx:"-130px", ty:"-182px", er:-8,  delay:0,    color:"rgba(255,50,100,0.9)",   w:87, h:121 },
  { sx:" 46vw", sy:"-34vh", sr: 45, tx:  "-43px", ty:"-182px", er: 5,  delay:0.1,  color:"rgba(100,50,255,0.9)",   w:87, h:121 },
  { sx:"  2vw", sy:"-48vh", sr:-25, tx:  " 44px", ty:"-182px", er:-4,  delay:0.05, color:"rgba(0,200,255,0.9)",    w:86, h:121 },
  { sx:"-46vw", sy:"  0vh", sr: 65, tx:"-130px",  ty:  "-61px", er: 6,  delay:0.15, color:"rgba(255,200,0,0.9)",    w:87, h:121 },
  { sx:"  0vw", sy:"  0vh", sr:  0, tx:  "-43px", ty:  "-61px", er: 0,  delay:0.08, color:"rgba(255,255,255,0.6)",  w:87, h:121 },
  { sx:" 48vw", sy:"  2vh", sr:-62, tx:  " 44px", ty:  "-61px", er:-5,  delay:0.18, color:"rgba(0,255,150,0.9)",    w:86, h:121 },
  { sx:"-42vw", sy:" 36vh", sr: 50, tx:"-130px",  ty:  " 61px", er: 7,  delay:0.12, color:"rgba(255,100,0,0.9)",    w:87, h:122 },
  { sx:"  1vw", sy:" 48vh", sr:-28, tx:  "-43px", ty:  " 61px", er:-3,  delay:0.22, color:"rgba(200,0,255,0.9)",    w:87, h:122 },
  { sx:" 44vw", sy:" 38vh", sr: 42, tx:  " 44px", ty:  " 61px", er: 4,  delay:0.06, color:"rgba(255,220,50,0.9)",   w:86, h:122 },
];

const MUR_RAYS = [
  { ang:   0, color:"rgba(255,50,50,0.9)"   }, { ang:  20, color:"rgba(255,130,0,0.85)"  },
  { ang:  40, color:"rgba(255,220,0,0.9)"   }, { ang:  60, color:"rgba(100,255,0,0.85)"  },
  { ang:  80, color:"rgba(0,255,150,0.9)"   }, { ang: 100, color:"rgba(0,220,255,0.85)"  },
  { ang: 120, color:"rgba(0,100,255,0.9)"   }, { ang: 140, color:"rgba(100,0,255,0.85)"  },
  { ang: 160, color:"rgba(200,0,255,0.9)"   }, { ang: 180, color:"rgba(255,0,150,0.85)"  },
  { ang: 200, color:"rgba(255,50,50,0.9)"   }, { ang: 220, color:"rgba(255,130,0,0.85)"  },
  { ang: 240, color:"rgba(255,220,0,0.9)"   }, { ang: 260, color:"rgba(0,255,150,0.85)"  },
  { ang: 280, color:"rgba(0,100,255,0.9)"   }, { ang: 300, color:"rgba(200,0,255,0.85)"  },
  { ang: 320, color:"rgba(255,0,100,0.9)"   }, { ang: 340, color:"rgba(255,100,0,0.85)"  },
];

type MURPhase = "glitch" | "space" | "shards" | "coalesce" | "explosion" | "reveal" | "done";

function MURRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [murPhase, setMurPhase] = useState<MURPhase>("glitch");
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;
  const CARD_W = 260, CARD_H = 364;
  const FW = 87, FH = 121;

  useEffect(() => {
    const t = [
      setTimeout(() => setMurPhase("space"),     700),
      setTimeout(() => setMurPhase("shards"),   1800),
      setTimeout(() => setMurPhase("coalesce"), 3400),
      setTimeout(() => setMurPhase("explosion"),4400),
      setTimeout(() => setMurPhase("reveal"),   5100),
      setTimeout(() => setMurPhase("done"),     6400),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const showShards   = murPhase === "shards" || murPhase === "coalesce";
  const showExplosion= murPhase === "explosion";
  const showCard     = murPhase === "reveal" || murPhase === "done";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style>{MUR_KEYFRAMES}</style>

      {/* 우주 배경 */}
      <div className="absolute inset-0 bg-[#000008]" style={{ animation: "murBgIn 0.4s ease forwards" }} />

      {/* 성운 레이어 */}
      {(murPhase !== "glitch") && (
        <>
          <div className="absolute pointer-events-none" style={{
            width: "160vmax", height: "160vmax",
            background: "conic-gradient(from 0deg, rgba(80,0,160,0.08), rgba(0,50,160,0.06), rgba(0,120,80,0.05), rgba(80,0,160,0.08))",
            animation: "murNebulaRotate 18s linear infinite",
          }} />
          <div className="absolute pointer-events-none" style={{
            width: "120vmax", height: "120vmax",
            background: "radial-gradient(ellipse 70% 50% at 35% 60%, rgba(120,0,200,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 70% 30%, rgba(0,80,200,0.08) 0%, transparent 60%)",
          }} />
        </>
      )}

      {/* 별 */}
      {(murPhase !== "glitch") && MUR_STARS.map((s, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none bg-white"
          style={{
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            animation: `murStarIn 0.3s ease ${Number(s.delay) * 0.3}s both, murStarTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* 글리치 레이어 */}
      {murPhase === "glitch" && (
        <div className="absolute inset-0 pointer-events-none" style={{ animation: "murGlitch 0.7s ease forwards" }}>
          <div className="absolute inset-0" style={{ background: "rgba(255,0,0,0.15)", mixBlendMode: "screen", animation: "murGlitchR 0.7s ease forwards" }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,255,0.15)", mixBlendMode: "screen", animation: "murGlitchB 0.7s ease forwards" }} />
        </div>
      )}

      {/* 카드 조각 */}
      {showShards && MUR_SHARDS.map((s, i) => (
        <div
          key={i}
          className="absolute overflow-hidden pointer-events-none"
          style={{
            width: s.w, height: s.h,
            marginLeft: `-${s.w / 2}px`, marginTop: `-${s.h / 2}px`,
            left: "50%", top: "50%",
            borderRadius: 6,
            ["--sx" as string]: s.sx,
            ["--sy" as string]: s.sy,
            ["--sr" as string]: `${s.sr}deg`,
            ["--tx" as string]: s.tx,
            ["--ty" as string]: s.ty,
            ["--er" as string]: `${s.er}deg`,
            ["--sc" as string]: s.color,
            animation: murPhase === "shards"
              ? `murShardIn 1.0s cubic-bezier(0.34,1.2,0.64,1) ${s.delay}s both, murShardPulse 0.6s ease-in-out ${s.delay}s infinite`
              : `murCoalesce 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.04}s both`,
            boxShadow: `0 0 16px 4px ${s.color}`,
          }}
        >
          {card.image_url ? (
            <img
              src={card.image_url}
              alt=""
              style={{
                width: CARD_W, height: CARD_H,
                objectFit: "cover",
                transform: `translate(${-(Math.floor(i / 3)) * FW}px, ${-(i % 3) * FH}px)`,
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: s.color, opacity: 0.4 }} />
          )}
        </div>
      ))}

      {/* 레인보우 폭발 */}
      {showExplosion && (
        <>
          {[0, 0.07, 0.14, 0.21].map((d, i) => (
            <div key={i} className="absolute rounded-full pointer-events-none"
              style={{
                width: 200, height: 200,
                marginLeft: -100, marginTop: -100,
                border: `${3 - i}px solid hsl(${i * 80}deg, 100%, 65%)`,
                animation: `murExplosionRing 0.65s ease-out ${d}s both`,
                boxShadow: `0 0 20px hsl(${i * 80}deg, 100%, 65%)`,
              }}
            />
          ))}
          {MUR_RAYS.map((r, i) => (
            <div key={i} className="absolute pointer-events-none"
              style={{
                width: 800, height: 2,
                background: `linear-gradient(to right, transparent, ${r.color}, transparent)`,
                left: "50%", top: "50%",
                marginLeft: -400, marginTop: -1,
                transformOrigin: "left center",
                ["--ang" as string]: `${r.ang}deg`,
                animation: `murExplosionRay 0.6s ease-out ${i * 0.022}s both`,
                boxShadow: `0 0 10px ${r.color}`,
              }}
            />
          ))}
        </>
      )}

      {/* 카드 완성 */}
      {showCard && (
        <div className="flex flex-col items-center gap-8">
          <div style={{ perspective: "1400px" }}>
            <div
              className="relative"
              style={{
                width: CARD_W, height: CARD_H,
                animation: murPhase === "reveal"
                  ? "murCardReveal 0.6s ease both"
                  : "murCameraOrbit 6s ease-in-out infinite",
              }}
            >
              {/* 무지개 글로우 */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ animation: "murRadiance 3s linear infinite" }} />

              {/* 카드 본체 */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
                    <span style={{ fontSize: "5rem" }}>{typeStyle.emoji}</span>
                    <p className="text-white font-bold text-lg mt-3 px-4 text-center">{card.name}</p>
                  </div>
                )}
                {/* 홀로그램 무지개 */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div style={{ position:"absolute", top:"-30%", width:"55%", height:"160%", background:"linear-gradient(105deg,transparent 28%,rgba(255,255,255,0.45) 50%,transparent 72%)", animation:"murHoloRainbow 2.4s ease-in-out infinite" }} />
                  <div style={{ position:"absolute", top:"-30%", width:"40%", height:"160%", background:"linear-gradient(105deg,transparent 28%,rgba(255,255,255,0.3) 50%,transparent 72%)", animation:"murHoloRainbow 2.4s ease-in-out 0.6s infinite" }} />
                </div>
              </div>
            </div>
          </div>

          {/* MUR 뱃지 */}
          <div className="font-black text-lg"
            style={{
              background: "linear-gradient(90deg,#ff3366,#ff9900,#ffff00,#00ff88,#00aaff,#8800ff,#ff3366)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 12px rgba(255,255,255,0.8))",
              animation: "murBadgeIn 0.8s cubic-bezier(0.34,1.4,0.64,1) both",
            }}
          >
            MUR 👑
          </div>

          {/* 확인 버튼 */}
          {murPhase === "done" && (
            <button
              onClick={onDone}
              className="px-10 py-3 font-bold rounded-2xl text-black transition-all"
              style={{
                background: "linear-gradient(135deg, #ff3366, #ff9900, #ffff00, #00ff88, #00aaff, #8800ff)",
                backgroundSize: "300% auto",
                boxShadow: "0 8px 40px rgba(255,255,255,0.4), 0 0 100px rgba(100,0,255,0.3)",
                animation: "murBtnIn 0.5s ease both",
              }}
            >
              확인 →
            </button>
          )}
        </div>
      )}

      {/* 건너뛰기 */}
      {murPhase !== "done" && (
        <button onClick={onDone} className="absolute bottom-8 right-8 text-xs text-white/20 hover:text-white/40 transition-colors">
          건너뛰기
        </button>
      )}
    </div>
  );
}

/* ─────────────── UR 등급 리빌 애니메이션 ─────────────── */
const UR_KEYFRAMES = `
@keyframes urBgIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes urPillarRise {
  0%   { transform: scaleY(0) translateX(-50%); opacity: 0; transform-origin: bottom center; }
  30%  { opacity: 1; }
  100% { transform: scaleY(1) translateX(-50%); opacity: 0.75; transform-origin: bottom center; }
}
@keyframes urPillarFade {
  0%   { opacity: 0.75; }
  100% { opacity: 0; }
}
@keyframes urCardReveal {
  0%   { transform: perspective(1400px) rotateY(-90deg) translateY(30px) scale(0.7); opacity: 0; filter: blur(20px); }
  45%  { filter: blur(5px); opacity: 1; }
  72%  { transform: perspective(1400px) rotateY(10deg) translateY(-8px) scale(1.07); filter: blur(0); }
  100% { transform: perspective(1400px) rotateY(0deg) translateY(0) scale(1); }
}
@keyframes urFloat {
  0%,100% { transform: translateY(0px) rotate(0.3deg); }
  50%      { transform: translateY(-14px) rotate(-0.3deg); }
}
@keyframes urLaser {
  0%   { transform: rotate(var(--ang)) scaleX(0); opacity: 0; transform-origin: left center; }
  18%  { opacity: 1; }
  72%  { opacity: 0.85; }
  100% { transform: rotate(var(--ang)) scaleX(1); opacity: 0; transform-origin: left center; }
}
@keyframes urHoloGold {
  0%   { transform: translateX(-140%) rotate(20deg); opacity: 0; }
  18%  { opacity: 0.65; }
  82%  { opacity: 0.65; }
  100% { transform: translateX(240%)  rotate(20deg); opacity: 0; }
}
@keyframes urHoloGold2 {
  0%   { transform: translateX(-140%) rotate(-15deg); opacity: 0; }
  18%  { opacity: 0.45; }
  82%  { opacity: 0.45; }
  100% { transform: translateX(240%)  rotate(-15deg); opacity: 0; }
}
@keyframes urDiamond {
  0%   { opacity: 0; transform: translate(0,0) rotate(45deg) scale(0); }
  25%  { opacity: 1; }
  65%  { opacity: 0.9; transform: translate(var(--dx),var(--dy)) rotate(225deg) scale(1.2); }
  100% { opacity: 0; transform: translate(var(--dx2),var(--dy2)) rotate(405deg) scale(0); }
}
@keyframes urFresnelPulse {
  0%,100% {
    box-shadow:
      0 0 45px 12px rgba(253,224,71,0.75),
      0 0 110px rgba(251,191,36,0.45),
      0 0 200px rgba(253,224,71,0.2);
  }
  50% {
    box-shadow:
      0 0 90px 26px rgba(253,224,71,1),
      0 0 200px rgba(251,191,36,0.7),
      0 0 320px rgba(253,224,71,0.4);
  }
}
@keyframes urBadgeIn {
  0%   { opacity: 0; transform: scale(0.3) translateY(16px); letter-spacing: 0; filter: blur(10px); }
  65%  { letter-spacing: 0.45em; filter: blur(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 0.38em; }
}
@keyframes urBtnIn {
  0%   { opacity: 0; transform: translateY(20px) scale(0.88); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes urParticleSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const UR_PILLARS = [
  { left: "15%", delay: 0,    width: 3,  height: "110vh", color: "rgba(253,224,71,0.6)" },
  { left: "30%", delay: 0.12, width: 2,  height: "90vh",  color: "rgba(251,191,36,0.5)" },
  { left: "50%", delay: 0.05, width: 5,  height: "120vh", color: "rgba(253,224,71,0.8)" },
  { left: "70%", delay: 0.14, width: 2,  height: "95vh",  color: "rgba(251,191,36,0.5)" },
  { left: "85%", delay: 0.08, width: 3,  height: "105vh", color: "rgba(253,224,71,0.6)" },
  { left: "42%", delay: 0.18, width: 1,  height: "80vh",  color: "rgba(255,255,255,0.4)" },
  { left: "60%", delay: 0.10, width: 1,  height: "75vh",  color: "rgba(255,255,255,0.35)" },
];

const UR_LASERS = [
  { ang: -32, color: "rgba(253,224,71,0.9)", len: 700, delay: 1.3 },
  { ang:  18, color: "rgba(255,255,255,0.8)", len: 650, delay: 1.38 },
  { ang: -55, color: "rgba(253,224,71,0.75)", len: 680, delay: 1.28 },
  { ang:  42, color: "rgba(255,255,255,0.7)", len: 640, delay: 1.44 },
  { ang:  -8, color: "rgba(253,224,71,0.85)", len: 710, delay: 1.34 },
  { ang:  68, color: "rgba(251,191,36,0.65)", len: 630, delay: 1.40 },
  { ang: -75, color: "rgba(255,255,255,0.6)", len: 660, delay: 1.26 },
  { ang:  85, color: "rgba(253,224,71,0.70)", len: 600, delay: 1.48 },
];

const UR_DIAMONDS = [
  { dx:"-55px", dy:"-75px", dx2:"-80px", dy2:"-110px", delay:2.1, size:7, color:"rgba(253,224,71,0.95)" },
  { dx:" 60px", dy:"-80px", dx2:" 90px", dy2:"-115px", delay:2.2, size:5, color:"rgba(255,255,255,0.9)" },
  { dx:"-70px", dy:" 45px", dx2:"-100px",dy2:" 65px",  delay:2.0, size:6, color:"rgba(253,224,71,0.85)" },
  { dx:" 65px", dy:" 55px", dx2:" 95px", dy2:" 80px",  delay:2.3, size:4, color:"rgba(255,255,255,0.85)" },
  { dx:"  8px", dy:"-90px", dx2:" 12px", dy2:"-130px", delay:2.15,size:8, color:"rgba(253,224,71,1)" },
  { dx:"-85px", dy:"-20px", dx2:"-120px",dy2:"-30px",  delay:2.25,size:5, color:"rgba(255,255,255,0.8)" },
  { dx:" 80px", dy:"-35px", dx2:"115px", dy2:"-50px",  delay:2.05,size:6, color:"rgba(253,224,71,0.9)" },
  { dx:"-45px", dy:" 85px", dx2:"-65px", dy2:"125px",  delay:2.35,size:4, color:"rgba(255,255,255,0.85)" },
  { dx:" 50px", dy:" 78px", dx2:" 75px", dy2:"115px",  delay:2.10,size:5, color:"rgba(253,224,71,0.88)" },
  { dx:"-95px", dy:" 60px", dx2:"-140px",dy2:" 88px",  delay:2.28,size:3, color:"rgba(255,255,255,0.75)" },
  { dx:" 90px", dy:"  5px", dx2:"130px", dy2:"  8px",  delay:2.18,size:4, color:"rgba(253,224,71,0.92)" },
  { dx:"-22px", dy:"-100px",dx2:"-32px", dy2:"-145px", delay:2.40,size:6, color:"rgba(255,255,255,0.88)" },
  { dx:" 30px", dy:" 95px", dx2:" 45px", dy2:"138px",  delay:2.08,size:5, color:"rgba(253,224,71,0.86)" },
  { dx:"-110px",dy:" 10px", dx2:"-160px",dy2:" 15px",  delay:2.32,size:3, color:"rgba(255,255,255,0.7)" },
  { dx:" 105px",dy:"-60px", dx2:"155px", dy2:"-88px",  delay:2.22,size:4, color:"rgba(253,224,71,0.8)" },
];

type URPhase = "pillar" | "reveal" | "float" | "done";

function URRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [urPhase, setUrPhase] = useState<URPhase>("pillar");
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = [
      setTimeout(() => setUrPhase("reveal"), 1100),
      setTimeout(() => setUrPhase("float"),  2000),
      setTimeout(() => setUrPhase("done"),   3800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style>{UR_KEYFRAMES}</style>

      {/* 배경 — 심연 금빛 */}
      <div className="absolute inset-0 bg-[#0a0800]" style={{ animation: "urBgIn 0.5s ease forwards" }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(251,191,36,0.12) 0%, rgba(253,224,71,0.05) 40%, transparent 70%)",
          opacity: urPhase === "float" || urPhase === "done" ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* 금빛 기둥 */}
      {(urPhase === "pillar" || urPhase === "reveal") && UR_PILLARS.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 pointer-events-none"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: `linear-gradient(to top, transparent, ${p.color} 30%, ${p.color} 70%, transparent)`,
            boxShadow: `0 0 ${p.width * 6}px ${p.color}`,
            animation: urPhase === "pillar"
              ? `urPillarRise 1.1s cubic-bezier(0.22,1,0.36,1) ${p.delay}s both`
              : `urPillarFade 0.6s ease forwards`,
          }}
        />
      ))}

      {/* 카드 + 레이저 + 다이아 */}
      {(urPhase === "reveal" || urPhase === "float" || urPhase === "done") && (
        <div className="flex flex-col items-center gap-8">

          {/* 레이저 반사 */}
          {urPhase === "reveal" && UR_LASERS.map((l, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                width: l.len, height: 2,
                background: `linear-gradient(to right, transparent, ${l.color}, transparent)`,
                left: "50%", top: "50%",
                marginLeft: `-${l.len / 2}px`, marginTop: "-1px",
                transformOrigin: "left center",
                ["--ang" as string]: `${l.ang}deg`,
                animation: `urLaser 0.65s ease-out ${l.delay - 1.3}s both`,
                boxShadow: `0 0 8px ${l.color}`,
              }}
            />
          ))}

          {/* 다이아 파티클 */}
          {(urPhase === "float" || urPhase === "done") && UR_DIAMONDS.map((d, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: "50%", top: "50%",
                width: d.size, height: d.size,
                marginLeft: `-${d.size / 2}px`, marginTop: `-${d.size / 2}px`,
                background: d.color,
                boxShadow: `0 0 ${d.size * 3}px ${d.color}, 0 0 ${d.size * 6}px rgba(253,224,71,0.4)`,
                ["--dx" as string]: d.dx,
                ["--dy" as string]: d.dy,
                ["--dx2" as string]: d.dx2,
                ["--dy2" as string]: d.dy2,
                animation: `urDiamond 1.6s ease-out ${d.delay - 2.0}s both`,
              }}
            />
          ))}

          {/* perspective 부모 */}
          <div style={{ perspective: "1400px" }}>
            <div
              className="relative"
              style={{
                width: 260, height: 364,
                animation: urPhase === "reveal"
                  ? "urCardReveal 0.9s cubic-bezier(0.34,1.15,0.64,1) both"
                  : "urFloat 3s ease-in-out infinite",
              }}
            >
              {/* Fresnel 엣지 글로우 */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  animation: urPhase !== "reveal" ? "urFresnelPulse 1.8s ease-in-out infinite" : undefined,
                }}
              />

              {/* 카드 본체 */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_40px_90px_rgba(0,0,0,0.95)]">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
                    <span className="text-7xl">{typeStyle.emoji}</span>
                    <p className="text-white font-bold text-lg mt-3 px-4 text-center">{card.name}</p>
                  </div>
                )}

                {/* 골드 홀로그램 2겹 */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div style={{ position: "absolute", top: "-30%", width: "55%", height: "160%", background: "linear-gradient(105deg, transparent 28%, rgba(253,224,71,0.5) 50%, transparent 72%)", animation: "urHoloGold 2.4s ease-in-out 0.3s infinite" }} />
                  <div style={{ position: "absolute", top: "-30%", width: "40%", height: "160%", background: "linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.35) 50%, transparent 72%)", animation: "urHoloGold2 2.4s ease-in-out 0.7s infinite" }} />
                </div>

                {/* 금빛 오버레이 shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(253,224,71,0.08) 0%, transparent 50%, rgba(253,224,71,0.08) 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* UR 뱃지 */}
          {(urPhase === "float" || urPhase === "done") && (
            <div
              className="font-black text-base"
              style={{
                background: "linear-gradient(90deg, #fde047, #fbbf24, #ffffff, #fbbf24, #fde047)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: "drop-shadow(0 0 8px rgba(253,224,71,0.9))",
                animation: "urBadgeIn 0.65s cubic-bezier(0.34,1.4,0.64,1) both",
              }}
            >
              UR ✦✦✦✦
            </div>
          )}

          {/* 확인 버튼 */}
          {urPhase === "done" && (
            <button
              onClick={onDone}
              className="px-10 py-3 font-bold rounded-2xl text-black transition-all"
              style={{
                background: "linear-gradient(135deg, #fde047, #fbbf24, #f59e0b)",
                boxShadow: "0 8px 32px rgba(253,224,71,0.6), 0 0 80px rgba(251,191,36,0.3)",
                animation: "urBtnIn 0.45s ease both",
              }}
            >
              확인 →
            </button>
          )}
        </div>
      )}

      {/* 건너뛰기 */}
      {urPhase !== "done" && (
        <button onClick={onDone} className="absolute bottom-8 right-8 text-xs text-yellow-900/50 hover:text-yellow-600/70 transition-colors">
          건너뛰기
        </button>
      )}
    </div>
  );
}

/* ─────────────── SAR 등급 리빌 애니메이션 ─────────────── */
const SAR_KEYFRAMES = `
@keyframes sarBgIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes sarDistortBg {
  0%   { transform: scale(1.06) skewX(0deg);   filter: hue-rotate(0deg)   blur(0px); }
  20%  { transform: scale(1.10) skewX(1.5deg); filter: hue-rotate(60deg)  blur(4px); }
  45%  { transform: scale(1.08) skewX(-1deg);  filter: hue-rotate(160deg) blur(2px); }
  70%  { transform: scale(1.05) skewX(0.8deg); filter: hue-rotate(280deg) blur(3px); }
  100% { transform: scale(1)    skewX(0deg);   filter: hue-rotate(360deg) blur(0px); }
}
@keyframes sarCrackGrow {
  0%   { stroke-dashoffset: 600; opacity: 0; }
  15%  { opacity: 1; }
  100% { stroke-dashoffset: 0;   opacity: 1; }
}
@keyframes sarCrackPulse {
  0%,100% { filter: drop-shadow(0 0 3px rgba(255,255,255,0.7)); }
  50%     { filter: drop-shadow(0 0 14px rgba(251,191,36,1)) drop-shadow(0 0 28px rgba(139,92,246,0.9)); }
}
@keyframes sarRay {
  0%   { opacity: 0; transform: rotate(var(--angle)) scaleX(0); transform-origin: left center; }
  20%  { opacity: var(--rop); }
  70%  { opacity: var(--rop); }
  100% { opacity: 0; transform: rotate(var(--angle)) scaleX(1.2); transform-origin: left center; }
}
@keyframes sarRainbow {
  0%   { opacity: 0; transform: rotate(0deg); }
  25%  { opacity: 0.18; }
  75%  { opacity: 0.18; }
  100% { opacity: 0; transform: rotate(30deg); }
}
@keyframes sarCardSpin {
  0%   { transform: perspective(1400px) rotateY(-160deg) scale(0.65); opacity: 0; filter: blur(24px); }
  35%  { opacity: 1; filter: blur(10px); }
  65%  { transform: perspective(1400px) rotateY(12deg)  scale(1.08); filter: blur(2px); }
  82%  { transform: perspective(1400px) rotateY(-5deg)  scale(1.03); }
  100% { transform: perspective(1400px) rotateY(0deg)   scale(1);    filter: blur(0); }
}
@keyframes sarHolo1 {
  0%   { transform: translateX(-130%) rotate(18deg);  opacity: 0; }
  20%  { opacity: 0.55; }
  80%  { opacity: 0.55; }
  100% { transform: translateX(230%)  rotate(18deg);  opacity: 0; }
}
@keyframes sarHolo2 {
  0%   { transform: translateX(-130%) rotate(-22deg); opacity: 0; }
  20%  { opacity: 0.4; }
  80%  { opacity: 0.4; }
  100% { transform: translateX(230%)  rotate(-22deg); opacity: 0; }
}
@keyframes sarHolo3 {
  0%   { transform: translateX(-130%) rotate(5deg);   opacity: 0; }
  20%  { opacity: 0.3; }
  80%  { opacity: 0.3; }
  100% { transform: translateX(230%)  rotate(5deg);   opacity: 0; }
}
@keyframes sarVolume {
  0%   { opacity: 0; transform: scaleY(0.2) rotate(var(--angle)); transform-origin: top center; }
  40%  { opacity: var(--vop); transform: scaleY(1) rotate(var(--angle)); }
  75%  { opacity: var(--vop); }
  100% { opacity: 0; transform: scaleY(1.3) rotate(var(--angle)); }
}
@keyframes sarGlowPulse {
  0%,100% {
    box-shadow:
      0 0 40px 10px rgba(251,191,36,0.6),
      0 0 90px rgba(139,92,246,0.5),
      0 0 160px rgba(244,63,94,0.3);
  }
  50% {
    box-shadow:
      0 0 80px 24px rgba(251,191,36,0.9),
      0 0 160px rgba(139,92,246,0.7),
      0 0 250px rgba(244,63,94,0.5);
  }
}
@keyframes sarBadgeIn {
  0%   { opacity: 0; transform: scale(0.4) translateY(18px); letter-spacing: 0; filter: blur(12px); }
  60%  { filter: blur(0); letter-spacing: 0.5em; }
  100% { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 0.4em; }
}
@keyframes sarBtnIn {
  0%   { opacity: 0; transform: translateY(20px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
`;

const SAR_CRACK_PATHS = [
  "M 50% 50% L 18% 5%",   "M 50% 50% L 82% 3%",
  "M 50% 50% L 5% 40%",   "M 50% 50% L 95% 35%",
  "M 50% 50% L 10% 75%",  "M 50% 50% L 92% 80%",
  "M 50% 50% L 35% 97%",  "M 50% 50% L 68% 96%",
  "M 50% 50% L 2% 20%",   "M 50% 50% L 98% 60%",
  "M 50% 50% L 50% 2%",   "M 50% 50% L 20% 98%",
];

const SAR_RAYS = [
  { angle:   0, color: "rgba(251,191,36,0.75)", rop: 0.75, len: 700 },
  { angle:  30, color: "rgba(139,92,246,0.65)", rop: 0.65, len: 650 },
  { angle:  60, color: "rgba(244,63,94,0.60)",  rop: 0.60, len: 680 },
  { angle:  90, color: "rgba(34,211,238,0.65)", rop: 0.65, len: 720 },
  { angle: 120, color: "rgba(251,191,36,0.55)", rop: 0.55, len: 660 },
  { angle: 150, color: "rgba(139,92,246,0.70)", rop: 0.70, len: 690 },
  { angle: 180, color: "rgba(251,191,36,0.65)", rop: 0.65, len: 700 },
  { angle: 210, color: "rgba(244,63,94,0.55)",  rop: 0.55, len: 640 },
  { angle: 240, color: "rgba(34,211,238,0.60)", rop: 0.60, len: 670 },
  { angle: 270, color: "rgba(139,92,246,0.65)", rop: 0.65, len: 710 },
  { angle: 300, color: "rgba(251,191,36,0.60)", rop: 0.60, len: 650 },
  { angle: 330, color: "rgba(244,63,94,0.70)",  rop: 0.70, len: 680 },
];

const SAR_VOLUMES = [
  { angle: -25, color: "rgba(251,191,36,0.12)", vop: 0.15 },
  { angle:  10, color: "rgba(139,92,246,0.10)", vop: 0.12 },
  { angle:  40, color: "rgba(244,63,94,0.10)",  vop: 0.13 },
  { angle: -55, color: "rgba(34,211,238,0.09)", vop: 0.11 },
  { angle:  70, color: "rgba(251,191,36,0.08)", vop: 0.10 },
];

type SARPhase = "intro" | "crack" | "light" | "card" | "done";

function SARRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [sarPhase, setSarPhase] = useState<SARPhase>("intro");
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = [
      setTimeout(() => setSarPhase("crack"), 700),
      setTimeout(() => setSarPhase("light"), 1400),
      setTimeout(() => setSarPhase("card"),  2100),
      setTimeout(() => setSarPhase("done"),  3600),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style>{SAR_KEYFRAMES}</style>

      {/* 배경 암전 */}
      <div className="absolute inset-0 bg-[#060410]" style={{ animation: "sarBgIn 0.5s ease forwards" }} />

      {/* 배경 왜곡 레이어 */}
      {(sarPhase === "intro" || sarPhase === "crack") && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139,92,246,0.12) 0%, rgba(251,191,36,0.06) 40%, transparent 70%)",
            animation: "sarDistortBg 1.4s ease-in-out forwards",
          }}
        />
      )}

      {/* 공간 균열 — SVG */}
      {(sarPhase === "crack" || sarPhase === "light") && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ animation: "sarCrackPulse 0.6s ease-in-out infinite" }}
        >
          {SAR_CRACK_PATHS.map((d, i) => (
            <line
              key={i}
              x1="50%" y1="50%"
              x2={d.split("L ")[1].split(" ")[0]}
              y2={d.split("L ")[1].split(" ")[1]}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
              strokeDasharray="600"
              strokeDashoffset="600"
              style={{ animation: `sarCrackGrow 0.5s ease-out ${i * 0.04}s both` }}
            />
          ))}
        </svg>
      )}

      {/* 다중 빛 레이어 */}
      {(sarPhase === "light" || sarPhase === "card" || sarPhase === "done") && (
        <>
          {/* 레인보우 코닉 회전 */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: "200vmax", height: "200vmax",
              background: "conic-gradient(from 0deg, rgba(251,191,36,0.07), rgba(139,92,246,0.07), rgba(244,63,94,0.07), rgba(34,211,238,0.07), rgba(251,191,36,0.07))",
              animation: "sarRainbow 3.5s ease forwards",
            }}
          />

          {/* 프리즘 광선 */}
          {SAR_RAYS.map((r, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                width: r.len,
                height: 3,
                background: `linear-gradient(to right, ${r.color}, transparent)`,
                left: "50%", top: "50%",
                marginTop: "-1.5px",
                transformOrigin: "left center",
                ["--angle" as string]: `${r.angle}deg`,
                ["--rop" as string]: r.rop,
                animation: `sarRay 0.9s ease-out ${0.05 + i * 0.03}s both`,
              }}
            />
          ))}
        </>
      )}

      {/* 볼류메트릭 라이트 (신의 빛줄기) */}
      {(sarPhase === "card" || sarPhase === "done") && SAR_VOLUMES.map((v, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: "3px",
            height: "120vh",
            background: `linear-gradient(to bottom, transparent, ${v.color}, transparent)`,
            top: "-10vh",
            left: "50%",
            transformOrigin: "top center",
            ["--angle" as string]: `${v.angle}deg`,
            ["--vop" as string]: v.vop,
            animation: `sarVolume 2.5s ease-in-out ${i * 0.15}s forwards`,
          }}
        />
      ))}

      {/* 카드 */}
      {(sarPhase === "card" || sarPhase === "done") && (
        <div className="flex flex-col items-center gap-8">
          <div style={{ perspective: "1400px" }}>
            <div
              className="relative"
              style={{ width: 260, height: 364, animation: "sarCardSpin 1.5s cubic-bezier(0.34,1.1,0.64,1) both" }}
            >
              {/* 엣지 글로우 */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ animation: "sarGlowPulse 2s ease-in-out 0.8s infinite" }}
              />

              {/* 카드 본체 */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.95)]">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
                    <span className="text-7xl">{typeStyle.emoji}</span>
                    <p className="text-white font-bold text-lg mt-3 px-4 text-center">{card.name}</p>
                  </div>
                )}

                {/* 홀로그램 3겹 */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div style={{ position: "absolute", top: "-30%", width: "50%", height: "160%", background: "linear-gradient(105deg, transparent 30%, rgba(251,191,36,0.35) 50%, transparent 70%)", animation: "sarHolo1 2.2s ease-in-out 0.6s both" }} />
                  <div style={{ position: "absolute", top: "-30%", width: "40%", height: "160%", background: "linear-gradient(105deg, transparent 30%, rgba(139,92,246,0.28) 50%, transparent 70%)", animation: "sarHolo2 2.2s ease-in-out 0.8s both" }} />
                  <div style={{ position: "absolute", top: "-30%", width: "35%", height: "160%", background: "linear-gradient(105deg, transparent 30%, rgba(34,211,238,0.22) 50%, transparent 70%)", animation: "sarHolo3 2.2s ease-in-out 1.0s both" }} />
                </div>
              </div>
            </div>
          </div>

          {/* SAR 뱃지 */}
          <div
            className="font-black text-base"
            style={{
              background: "linear-gradient(90deg, #fbbf24, #a78bfa, #f43f5e, #22d3ee, #fbbf24)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "sarBadgeIn 0.7s cubic-bezier(0.34,1.4,0.64,1) 0.5s both",
            }}
          >
            SAR ✦✦✦
          </div>

          {/* 확인 버튼 */}
          {sarPhase === "done" && (
            <button
              onClick={onDone}
              className="px-10 py-3 font-semibold rounded-2xl text-white transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.9), rgba(139,92,246,0.9))",
                boxShadow: "0 8px 32px rgba(251,191,36,0.45), 0 0 60px rgba(139,92,246,0.3)",
                animation: "sarBtnIn 0.45s ease both",
              }}
            >
              확인 →
            </button>
          )}
        </div>
      )}

      {/* 건너뛰기 */}
      {sarPhase !== "done" && (
        <button onClick={onDone} className="absolute bottom-8 right-8 text-xs text-white/25 hover:text-white/50 transition-colors">
          건너뛰기
        </button>
      )}
    </div>
  );
}

/* ─────────────── SR 등급 리빌 애니메이션 ─────────────── */
const SR_KEYFRAMES = `
@keyframes srBgIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes srEnergyBuild {
  0%   { transform: scale(0.1); opacity: 0; filter: blur(60px); }
  40%  { opacity: 0.8; filter: blur(35px); }
  100% { transform: scale(2.8); opacity: 1; filter: blur(22px); }
}
@keyframes srEnergyPulse {
  0%,100% { transform: scale(1); opacity: 0.75; }
  50%      { transform: scale(1.18); opacity: 1; }
}
@keyframes srSpark {
  0%   { opacity: 0; transform: rotate(var(--angle)) scaleX(0); transform-origin: left center; }
  25%  { opacity: 1; transform: rotate(var(--angle)) scaleX(1); transform-origin: left center; }
  75%  { opacity: 0.7; }
  100% { opacity: 0; transform: rotate(var(--angle)) scaleX(1.6); transform-origin: left center; }
}
@keyframes srShake {
  0%,100% { transform: translate(0,0); }
  12%     { transform: translate(-7px, 3px); }
  25%     { transform: translate(6px,-4px); }
  37%     { transform: translate(-5px, 5px); }
  50%     { transform: translate(5px,-3px); }
  62%     { transform: translate(-4px, 4px); }
  75%     { transform: translate(4px,-2px); }
  87%     { transform: translate(-2px, 2px); }
}
@keyframes srCardIn {
  0%   { transform: scale(0.55) translateY(50px); opacity: 0; filter: blur(22px); }
  55%  { filter: blur(3px); }
  78%  { transform: scale(1.1) translateY(-8px); }
  100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
}
@keyframes srBloom {
  0%   { transform: scale(0.2); opacity: 1; filter: blur(0); }
  45%  { opacity: 0.6; filter: blur(8px); }
  100% { transform: scale(5); opacity: 0; filter: blur(20px); }
}
@keyframes srBurstRing {
  0%   { transform: scale(0.2); opacity: 0.9; }
  100% { transform: scale(4.5); opacity: 0; }
}
@keyframes srGlowPulse {
  0%,100% { box-shadow: 0 0 30px 8px rgba(239,68,68,0.55), 0 0 80px rgba(249,115,22,0.25); }
  50%      { box-shadow: 0 0 65px 18px rgba(239,68,68,0.85), 0 0 130px rgba(249,115,22,0.5); }
}
@keyframes srEmber {
  0%   { opacity: 0; transform: translate(0,0) scale(1); }
  18%  { opacity: var(--eo); }
  100% { opacity: 0; transform: translate(var(--ex),var(--ey)) scale(0.2); }
}
@keyframes srBadgeIn {
  0%   { opacity: 0; transform: scale(0.7) translateY(12px); letter-spacing: 0.05em; }
  100% { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 0.25em; }
}
@keyframes srBtnIn {
  0%   { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

const SR_SPARKS = [
  { angle:   0, len: 90 }, { angle:  30, len: 65 }, { angle:  60, len: 80 },
  { angle:  90, len: 95 }, { angle: 120, len: 70 }, { angle: 150, len: 75 },
  { angle: 180, len: 85 }, { angle: 210, len: 60 }, { angle: 240, len: 88 },
  { angle: 270, len: 92 }, { angle: 300, len: 68 }, { angle: 330, len: 78 },
  { angle:  15, len: 50 }, { angle:  75, len: 55 }, { angle: 195, len: 52 }, { angle: 255, len: 58 },
];

const SR_EMBERS = [
  { left:"50%", top:"50%", ex:"-55px", ey:"-80px", eo:0.9, delay:1.3, dur:0.9, size:4 },
  { left:"50%", top:"50%", ex:" 60px", ey:"-75px", eo:0.8, delay:1.35,dur:0.85,size:3 },
  { left:"50%", top:"50%", ex:"-70px", ey:" 30px", eo:0.7, delay:1.28,dur:1.0, size:3 },
  { left:"50%", top:"50%", ex:" 65px", ey:" 40px", eo:0.9, delay:1.38,dur:0.8, size:5 },
  { left:"50%", top:"50%", ex:"  5px", ey:"-90px", eo:0.8, delay:1.32,dur:0.95,size:3 },
  { left:"50%", top:"50%", ex:"-80px", ey:"-20px", eo:0.7, delay:1.42,dur:0.88,size:4 },
  { left:"50%", top:"50%", ex:" 75px", ey:"-30px", eo:0.9, delay:1.25,dur:0.92,size:3 },
  { left:"50%", top:"50%", ex:"-40px", ey:" 78px", eo:0.8, delay:1.45,dur:0.85,size:4 },
  { left:"50%", top:"50%", ex:" 50px", ey:" 72px", eo:0.7, delay:1.30,dur:1.0, size:3 },
  { left:"50%", top:"50%", ex:"-90px", ey:" 55px", eo:0.6, delay:1.40,dur:0.9, size:2 },
  { left:"50%", top:"50%", ex:" 88px", ey:" 10px", eo:0.8, delay:1.26,dur:0.95,size:3 },
  { left:"50%", top:"50%", ex:"-20px", ey:"-95px", eo:0.9, delay:1.43,dur:0.82,size:4 },
];

type SRPhase = "charge" | "spark" | "card" | "done";

function SRRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [srPhase, setSrPhase] = useState<SRPhase>("charge");
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = [
      setTimeout(() => setSrPhase("spark"), 900),
      setTimeout(() => setSrPhase("card"),  1300),
      setTimeout(() => setSrPhase("done"),  2400),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style>{SR_KEYFRAMES}</style>

      {/* 배경 암전 */}
      <div className="absolute inset-0 bg-[#0c0204]" style={{ animation: "srBgIn 0.45s ease forwards" }} />

      {/* 붉은 에너지 광원 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 220, height: 220,
          background: "radial-gradient(circle, rgba(239,68,68,0.95) 0%, rgba(249,115,22,0.6) 40%, transparent 70%)",
          animation: srPhase === "charge"
            ? "srEnergyBuild 0.9s cubic-bezier(0.4,0,0.2,1) forwards"
            : "srEnergyPulse 0.4s ease-in-out infinite",
          opacity: srPhase === "card" || srPhase === "done" ? 0 : undefined,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* 전기 스파크 */}
      {(srPhase === "spark" || srPhase === "card") && SR_SPARKS.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: s.len,
            height: 2,
            background: "linear-gradient(to right, rgba(251,191,36,0.95), rgba(239,68,68,0.8), transparent)",
            left: "50%",
            top: "50%",
            marginTop: "-1px",
            transformOrigin: "left center",
            ["--angle" as string]: `${s.angle}deg`,
            animation: `srSpark 0.45s ease-out ${i * 0.018}s both`,
            boxShadow: "0 0 6px rgba(251,191,36,0.8)",
          }}
        />
      ))}

      {/* 카드 + 흔들림 + 빛 폭발 */}
      {(srPhase === "card" || srPhase === "done") && (
        <div
          className="flex flex-col items-center gap-7"
          style={{ animation: srPhase === "card" ? "srShake 0.45s ease-out" : undefined }}
        >
          {/* 빛 폭발 링 */}
          {srPhase === "card" && (
            <>
              <div className="absolute w-72 h-72 rounded-full bg-white pointer-events-none"
                style={{ animation: "srBloom 0.5s ease-out forwards" }} />
              {[0, 0.08, 0.16].map((d, i) => (
                <div key={i} className="absolute rounded-full border-2 border-red-300/70 pointer-events-none"
                  style={{ width: 200, height: 200, animation: `srBurstRing 0.55s ease-out ${d}s forwards` }} />
              ))}
            </>
          )}

          {/* 불꽃 파티클 */}
          {SR_EMBERS.map((e, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: e.left, top: e.top,
                width: e.size, height: e.size,
                marginLeft: `-${e.size / 2}px`, marginTop: `-${e.size / 2}px`,
                background: i % 3 === 0 ? "rgba(251,191,36,0.95)" : i % 3 === 1 ? "rgba(239,68,68,0.95)" : "rgba(249,115,22,0.95)",
                boxShadow: `0 0 ${e.size * 3}px currentColor`,
                ["--ex" as string]: e.ex,
                ["--ey" as string]: e.ey,
                ["--eo" as string]: e.eo,
                animation: `srEmber ${e.dur}s ease-out ${e.delay}s both`,
              }}
            />
          ))}

          {/* perspective 부모 */}
          <div style={{ perspective: "1000px" }}>
            <div
              className="relative"
              style={{
                width: 250, height: 350,
                animation: "srCardIn 0.85s cubic-bezier(0.34,1.2,0.64,1) both",
              }}
            >
              {/* 엣지 글로우 */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ animation: "srGlowPulse 1.8s ease-in-out 0.8s infinite" }} />

              {/* 카드 본체 */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
                    <span className="text-7xl">{typeStyle.emoji}</span>
                    <p className="text-white font-bold text-lg mt-3 px-4 text-center">{card.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SR 뱃지 */}
          <div
            className="text-orange-300 font-bold tracking-widest text-sm"
            style={{ animation: "srBadgeIn 0.45s cubic-bezier(0.34,1.3,0.64,1) 0.75s both" }}
          >
            SR ✦✦
          </div>

          {/* 확인 버튼 */}
          {srPhase === "done" && (
            <button
              onClick={onDone}
              className="px-9 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-2xl transition-colors"
              style={{ animation: "srBtnIn 0.4s ease both", boxShadow: "0 8px 30px rgba(239,68,68,0.45)" }}
            >
              확인 →
            </button>
          )}
        </div>
      )}

      {/* 건너뛰기 */}
      {srPhase !== "done" && (
        <button onClick={onDone} className="absolute bottom-8 right-8 text-xs text-white/25 hover:text-white/50 transition-colors">
          건너뛰기
        </button>
      )}
    </div>
  );
}

/* ─────────────── AR 전용 시네마틱 애니메이션 ─────────────── */
const AR_KEYFRAMES = `
@keyframes arBgIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes arCardSlideIn {
  0%   { transform: scale(0.72) translateY(60px); opacity: 0; filter: blur(18px); }
  55%  { filter: blur(2px); }
  100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
}
@keyframes arIllustZoom {
  0%   { transform: scale(1.18); }
  100% { transform: scale(1); }
}
@keyframes arDustFloat {
  0%   { opacity: 0; transform: translate(0, 0) scale(1); }
  15%  { opacity: var(--ao); }
  80%  { opacity: var(--ao); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.4); }
}
@keyframes arGlowPulse {
  0%,100% { box-shadow: 0 0 28px 6px rgba(244,63,94,0.45), 0 0 70px rgba(139,92,246,0.2); }
  50%      { box-shadow: 0 0 56px 14px rgba(244,63,94,0.75), 0 0 120px rgba(139,92,246,0.4); }
}
@keyframes arBadgeIn {
  0%   { opacity: 0; transform: translateY(14px) scale(0.85); letter-spacing: 0.05em; }
  100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 0.3em; }
}
@keyframes arBtnIn {
  0%   { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

const AR_DUST: { left: string; top: string; size: number; dx: string; dy: string; ao: number; delay: number; dur: number }[] = [
  { left: "20%", top: "30%", size: 3, dx: "-18px", dy: "-30px", ao: 0.55, delay: 0.1, dur: 2.8 },
  { left: "75%", top: "25%", size: 2, dx:  "22px", dy: "-25px", ao: 0.45, delay: 0.4, dur: 3.2 },
  { left: "15%", top: "65%", size: 4, dx: "-14px", dy:  "28px", ao: 0.5,  delay: 0.7, dur: 2.5 },
  { left: "80%", top: "70%", size: 2, dx:  "16px", dy:  "22px", ao: 0.4,  delay: 0.2, dur: 3.6 },
  { left: "50%", top: "15%", size: 3, dx:  "10px", dy: "-32px", ao: 0.6,  delay: 0.9, dur: 2.9 },
  { left: "30%", top: "80%", size: 2, dx: "-20px", dy:  "18px", ao: 0.35, delay: 0.5, dur: 3.1 },
  { left: "65%", top: "55%", size: 3, dx:  "24px", dy: "-16px", ao: 0.5,  delay: 1.1, dur: 2.6 },
  { left: "10%", top: "45%", size: 2, dx: "-26px", dy:  "12px", ao: 0.45, delay: 0.3, dur: 3.4 },
  { left: "88%", top: "40%", size: 3, dx:  "18px", dy: "-20px", ao: 0.4,  delay: 0.8, dur: 2.7 },
  { left: "42%", top: "88%", size: 2, dx:  "-8px", dy:  "26px", ao: 0.55, delay: 1.3, dur: 3.0 },
  { left: "58%", top: "10%", size: 4, dx:  "12px", dy: "-28px", ao: 0.4,  delay: 0.6, dur: 2.4 },
  { left: "25%", top: "18%", size: 2, dx: "-16px", dy: "-22px", ao: 0.5,  delay: 1.0, dur: 3.3 },
];

function ARRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!revealed) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * 13;
    const ry = -((e.clientX - cx) / (rect.width / 2)) * 13;
    setTilt({ x: rx, y: ry });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <style>{AR_KEYFRAMES}</style>

      {/* 배경 */}
      <div
        className="absolute inset-0 bg-[#08030f]"
        style={{ animation: "arBgIn 0.6s ease forwards" }}
      />
      {/* 배경 방사형 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(244,63,94,0.14) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)",
          animation: "arBgIn 1.2s ease 0.5s both",
        }}
      />

      {/* 먼지 파티클 */}
      {AR_DUST.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-rose-200 pointer-events-none"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            ["--dx" as string]: d.dx,
            ["--dy" as string]: d.dy,
            ["--ao" as string]: d.ao,
            opacity: 0,
            animation: `arDustFloat ${d.dur}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* 카드 영역 */}
      <div className="flex flex-col items-center gap-8">
        {/* perspective 부모 */}
        <div style={{ perspective: "1000px" }}>
          <div
            style={{
              position: "relative",
              width: 260,
              height: 364,
              transition: "transform 0.12s ease-out",
              transform: revealed
                ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                : undefined,
              animation: !revealed ? "arCardSlideIn 1.1s cubic-bezier(0.34,1.2,0.64,1) 0.3s both" : undefined,
            }}
          >
            {/* 엣지 글로우 */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ animation: "arGlowPulse 2.2s ease-in-out 1.8s infinite" }}
            />

            {/* 카드 본체 */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.85)]">
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  style={{ animation: "arIllustZoom 1.4s cubic-bezier(0.4,0,0.2,1) 0.3s both" }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center`}>
                  <span style={{ fontSize: "5rem" }}>{typeStyle.emoji}</span>
                  <p className="text-white font-bold text-lg mt-3 px-4 text-center">{card.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AR 뱃지 */}
        <div
          className="text-rose-300 font-bold tracking-widest text-sm"
          style={{ animation: "arBadgeIn 0.5s cubic-bezier(0.34,1.3,0.64,1) 1.6s both" }}
        >
          AR ✦
        </div>

        {/* 확인 버튼 */}
        {revealed && (
          <button
            onClick={onDone}
            className="px-9 py-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-2xl transition-colors"
            style={{ animation: "arBtnIn 0.4s ease both", boxShadow: "0 8px 30px rgba(244,63,94,0.4)" }}
          >
            확인 →
          </button>
        )}
      </div>

      {/* 건너뛰기 */}
      {!revealed && (
        <button
          onClick={onDone}
          className="absolute bottom-8 right-8 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}
