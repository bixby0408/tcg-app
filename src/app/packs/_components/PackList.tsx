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
  | { type: "reveal"; cards: PulledCard[]; currentIndex: number; flipped: boolean }
  | { type: "ar-reveal"; cards: PulledCard[]; currentIndex: number }
  | { type: "done"; cards: PulledCard[] };

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

export default function PackList({ packs, balance }: { packs: Pack[]; balance: number }) {
  const [phase, setPhase] = useState<Phase>({ type: "list" });
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const animWrapperRef = useRef<HTMLDivElement>(null);

  // 카드 변경/뒤집기 시 등급별 애니메이션을 직접 재시작
  useEffect(() => {
    const el = animWrapperRef.current;
    if (!el || phase.type !== "reveal") return;

    const { currentIndex, flipped, cards } = phase;
    const rarity = cards[currentIndex].card.rarity;

    // 첫 번째 카드 뒤집기: CSS rotateY 트랜지션이 리빌이므로 입장 애니메이션 불필요
    if (currentIndex === 0 && flipped) return;

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

    setPhase({ type: "reveal", cards: result.cards, currentIndex: 0, flipped: false });
  }

  function flipCurrent() {
    if (phase.type !== "reveal" || phase.flipped) return;
    const rarity = phase.cards[phase.currentIndex].card.rarity;
    if (rarity === "AR") {
      setPhase({ type: "ar-reveal", cards: phase.cards, currentIndex: phase.currentIndex });
      return;
    }
    triggerFlash(rarity);
    setPhase({ ...phase, flipped: true });
  }

  function handleARDone() {
    if (phase.type !== "ar-reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards });
    } else {
      const rarity = phase.cards[next].card.rarity;
      triggerFlash(rarity);
      setPhase({ type: "reveal", cards: phase.cards, currentIndex: next, flipped: true });
    }
  }

  function nextCard() {
    if (phase.type !== "reveal") return;
    const next = phase.currentIndex + 1;
    if (next >= phase.cards.length) {
      setPhase({ type: "done", cards: phase.cards });
    } else {
      const rarity = phase.cards[next].card.rarity;
      triggerFlash(rarity);
      setPhase({ ...phase, currentIndex: next, flipped: true });
    }
  }

  function skipAll() {
    if (phase.type === "reveal") setPhase({ type: "done", cards: phase.cards });
    else if (phase.type === "ar-reveal") setPhase({ type: "done", cards: phase.cards });
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
        <p className="text-gray-400 text-sm font-medium">뽑기 결과</p>

        {/* 카드 썸네일 그리드 */}
        <div className="flex flex-wrap justify-center gap-3">
          {phase.cards.map((pc) => {
            const rarity = pc.card.rarity as Rarity;
            const typeStyle = TYPE_STYLE[pc.card.card_type ?? "default"] ?? TYPE_STYLE.default;
            return (
              <div
                key={pc.userCardId}
                className={`relative w-24 h-[134px] rounded-xl overflow-hidden shadow-lg ${RARITY_GLOW[rarity]}`}
              >
                {pc.card.image_url ? (
                  <img src={pc.card.image_url} alt={pc.card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col items-center justify-center gap-1`}>
                    <span className="text-2xl">{typeStyle.emoji}</span>
                    <span className="text-[9px] text-white/80 font-bold text-center px-1 leading-tight">{pc.card.name}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
                  <p className="text-[8px] text-white/90 font-bold truncate">{pc.card.name}</p>
                  <p className="text-[7px] text-white/60">{RARITY_LABEL[rarity] ?? rarity}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 목록 요약 */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-3">획득한 카드</p>
          <div className="space-y-1.5">
            {phase.cards.map((pc) => {
              const rarity = pc.card.rarity as Rarity;
              return (
                <div key={pc.userCardId} className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{pc.card.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border ${RARITY_BORDER[rarity] ?? ""}`}>
                    {RARITY_LABEL[rarity] ?? rarity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setPhase({ type: "list" })}
          className="px-7 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-colors"
        >
          팩 목록으로
        </button>
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

      {packs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-600">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-sm">판매 중인 팩이 없습니다</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} balance={balance} onBuy={() => handleBuy(pack)} />
          ))}
        </div>
      )}

    </div>
  );
}

/* ── 팩 카드 컴포넌트 ── */
function PackCard({ pack, balance, onBuy }: { pack: Pack; balance: number; onBuy: () => void }) {
  const canAfford = balance >= pack.price;

  return (
    <div className="overflow-hidden bg-gradient-to-b from-violet-900/30 to-purple-950/60 border border-white/10 rounded-2xl hover:border-violet-500/40 transition-all group flex flex-col">
      {/* 메인 이미지 영역 */}
      <div className="relative w-full h-52 overflow-hidden rounded-t-2xl bg-violet-900/20 flex-shrink-0">
        {pack.image_url ? (
          <img
            src={pack.image_url}
            alt={pack.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
            disabled={!canAfford}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canAfford
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {canAfford ? "뽑기" : "코인 부족"}
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

/* ─────────────── AR 전용 시네마틱 애니메이션 ─────────────── */
const AR_KEYFRAMES = `
@keyframes arPackDrop {
  0%   { transform: translateY(-140px) scale(0.75); opacity: 0; }
  65%  { transform: translateY(12px) scale(1.06); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes arPackShake {
  0%,100% { transform: rotate(0deg) scale(1); }
  25%     { transform: rotate(-4deg) scale(1.02); }
  75%     { transform: rotate(4deg) scale(1.02); }
}
@keyframes arLeak {
  0%   { opacity: 0; transform: scaleX(0); }
  100% { opacity: 1; transform: scaleX(1); }
}
@keyframes arShine {
  0%   { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateX(500%) skewX(-20deg); opacity: 0; }
}
@keyframes arTextBurst {
  0%   { transform: scale(0.2); opacity: 0; letter-spacing: 0.05em; filter: blur(12px); }
  60%  { transform: scale(1.18); opacity: 1; letter-spacing: 0.45em; filter: blur(0); }
  100% { transform: scale(1); opacity: 1; letter-spacing: 0.35em; filter: blur(0); }
}
@keyframes arRing {
  0%   { transform: scale(0.2); opacity: 0.9; }
  100% { transform: scale(4); opacity: 0; }
}
@keyframes arCardReveal {
  0%   { transform: rotateY(90deg) scale(0.75); opacity: 0; }
  55%  { transform: rotateY(-8deg) scale(1.06); opacity: 1; }
  100% { transform: rotateY(0deg) scale(1); opacity: 1; }
}
@keyframes arHologram {
  0%   { transform: translateX(-100%) rotate(20deg); opacity: 0; }
  15%  { opacity: 0.55; }
  85%  { opacity: 0.55; }
  100% { transform: translateX(220%) rotate(20deg); opacity: 0; }
}
@keyframes arGlowPulse {
  0%,100% { opacity: 0.45; }
  50%     { opacity: 1; }
}
@keyframes arButtonSlide {
  0%   { transform: translateY(18px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
`;

type ARScene = "pack" | "leak" | "confirm" | "reveal" | "done";

const AR_PARTICLES = [
  { x: -90, y: -70, color: "rgba(34,211,238,0.7)",  size: 5, delay: 0 },
  { x:  95, y: -50, color: "rgba(139,92,246,0.7)",  size: 4, delay: 0.08 },
  { x: -75, y:  75, color: "rgba(244,63,94,0.6)",   size: 6, delay: 0.15 },
  { x:  85, y:  80, color: "rgba(34,211,238,0.5)",  size: 4, delay: 0.05 },
  { x:   0, y: -95, color: "rgba(255,255,255,0.6)", size: 3, delay: 0.2 },
  { x:-115, y:  10, color: "rgba(139,92,246,0.6)",  size: 5, delay: 0.1 },
  { x: 110, y: -15, color: "rgba(244,63,94,0.5)",   size: 3, delay: 0.18 },
  { x: -40, y: 110, color: "rgba(34,211,238,0.4)",  size: 4, delay: 0.12 },
];

function ARRevealAnimation({ pulled, onDone }: { pulled: PulledCard; onDone: () => void }) {
  const [scene, setScene] = useState<ARScene>("pack");
  const { card } = pulled;
  const typeStyle = TYPE_STYLE[card.card_type ?? "default"] ?? TYPE_STYLE.default;

  useEffect(() => {
    const t = [
      setTimeout(() => setScene("leak"),    1000),
      setTimeout(() => setScene("confirm"), 2000),
      setTimeout(() => setScene("reveal"),  3000),
      setTimeout(() => setScene("done"),    4500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      <style>{AR_KEYFRAMES}</style>

      {/* 배경 앰비언트 글로우 */}
      <div className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, transparent 70%)", opacity: scene === "leak" || scene === "confirm" ? 1 : 0 }} />
      <div className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(244,63,94,0.18) 0%, transparent 65%)", opacity: scene === "reveal" || scene === "done" ? 1 : 0 }} />

      {/* ── Scene 1 & 2: 팩 등장 + 빛 새어나옴 ── */}
      {(scene === "pack" || scene === "leak") && (
        <div className="relative flex items-center justify-center">
          <div className="relative w-40 h-52 rounded-2xl flex items-center justify-center select-none"
            style={{
              background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #0c0a1a 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
              animation: scene === "pack" ? "arPackDrop 0.85s cubic-bezier(0.34,1.3,0.64,1) both" : "arPackShake 0.45s ease-in-out infinite",
              boxShadow: scene === "leak" ? "0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(139,92,246,0.3)" : "0 0 20px rgba(139,92,246,0.3)",
            }}
          >
            <div className="text-center">
              <div className="text-5xl opacity-25">🃏</div>
              <p className="text-violet-400/30 text-xs font-black tracking-widest mt-2">TCG</p>
            </div>
            {scene === "leak" && (
              <>
                <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px rounded-full" style={{ width: "65%", background: "linear-gradient(90deg,transparent,rgba(34,211,238,0.95),transparent)", animation: "arLeak 0.25s ease-out both", boxShadow: "0 0 14px rgba(34,211,238,0.9)" }} />
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 h-px rounded-full" style={{ width: "65%", background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.95),transparent)", animation: "arLeak 0.25s ease-out 0.1s both", boxShadow: "0 0 14px rgba(139,92,246,0.9)" }} />
                <div className="absolute -left-px top-1/2 -translate-y-1/2 w-px rounded-full"  style={{ height: "40%", background: "linear-gradient(180deg,transparent,rgba(244,63,94,0.9),transparent)", animation: "arLeak 0.25s ease-out 0.15s both", boxShadow: "0 0 12px rgba(244,63,94,0.8)" }} />
                <div className="absolute -right-px top-1/2 -translate-y-1/2 w-px rounded-full" style={{ height: "40%", background: "linear-gradient(180deg,transparent,rgba(34,211,238,0.7),transparent)", animation: "arLeak 0.25s ease-out 0.2s both", boxShadow: "0 0 12px rgba(34,211,238,0.7)" }} />
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div style={{ position: "absolute", inset: 0, width: "45%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)", animation: "arShine 0.9s ease-in-out 0.2s both" }} />
                </div>
              </>
            )}
          </div>
          {scene === "leak" && AR_PARTICLES.map((p, i) => (
            <div key={i} className="absolute rounded-full pointer-events-none"
              style={{ width: p.size, height: p.size, background: p.color, left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, boxShadow: `0 0 ${p.size * 3}px ${p.color}`, animation: `arGlowPulse 0.55s ease-in-out ${p.delay}s infinite` }}
            />
          ))}
        </div>
      )}

      {/* ── Scene 3: AR 확정 ── */}
      {scene === "confirm" && (
        <div className="relative flex flex-col items-center gap-5">
          {[0, 0.18, 0.36].map((delay, i) => (
            <div key={i} className="absolute w-28 h-28 rounded-full border border-cyan-400/70"
              style={{ animation: `arRing 1.1s ease-out ${delay}s both` }} />
          ))}
          <div style={{ fontSize: "5.5rem", fontWeight: 100, letterSpacing: "0.35em", color: "rgba(34,211,238,0.95)", textShadow: "0 0 20px rgba(34,211,238,0.9), 0 0 60px rgba(34,211,238,0.5), 0 0 120px rgba(139,92,246,0.4)", animation: "arTextBurst 0.65s cubic-bezier(0.34,1.5,0.64,1) both" }}>
            AR
          </div>
          <div className="w-20 h-28 rounded-xl opacity-40" style={{ background: "linear-gradient(135deg,rgba(244,63,94,0.25),rgba(139,92,246,0.25))", border: "1px solid rgba(244,63,94,0.4)", backdropFilter: "blur(6px)" }} />
        </div>
      )}

      {/* ── Scene 4 & 5: 카드 공개 + 완료 ── */}
      {(scene === "reveal" || scene === "done") && (
        <div className="flex flex-col items-center gap-8">
          <div className="relative" style={{ width: 260, height: 364, perspective: "1000px", animation: scene === "reveal" ? "arCardReveal 1.3s cubic-bezier(0.34,1.4,0.64,1) both" : undefined }}>
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: "0 0 30px rgba(244,63,94,0.65), 0 0 70px rgba(244,63,94,0.3), 0 0 120px rgba(139,92,246,0.2)", animation: "arGlowPulse 2s ease-in-out infinite" }} />
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${typeStyle.bg} flex flex-col`}>
                  <div className="flex-1 flex items-center justify-center"><span className="text-8xl">{typeStyle.emoji}</span></div>
                  <div className="px-5 pb-5">
                    <p className="text-white font-black text-xl leading-tight">{card.name}</p>
                    <p className="text-white/60 text-sm mt-0.5">AR ✦</p>
                  </div>
                </div>
              )}
              {scene === "reveal" && (
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div style={{ position: "absolute", top: "-20%", width: "55%", height: "140%", background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.28) 50%,transparent 65%)", animation: "arHologram 1.5s ease-in-out 0.4s both" }} />
                </div>
              )}
            </div>
          </div>
          {scene === "done" && (
            <button onClick={onDone}
              className="px-9 py-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-rose-900/40 text-sm"
              style={{ animation: "arButtonSlide 0.4s ease-out both" }}
            >
              확인 →
            </button>
          )}
        </div>
      )}

      {scene !== "done" && (
        <button onClick={onDone} className="absolute bottom-8 right-8 text-xs text-white/25 hover:text-white/50 transition-colors">
          건너뛰기
        </button>
      )}
    </div>
  );
}
