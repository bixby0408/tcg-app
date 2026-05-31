"use client";

export type TickerPull = {
  cardName: string;
  rarity: "UR" | "MUR";
  nickname: string;
};

export default function PullsTicker({ pulls }: { pulls: TickerPull[] }) {
  if (pulls.length === 0) return null;

  const duration = Math.max(20, pulls.length * 5);
  const items = [...pulls, ...pulls];

  return (
    <div className="w-full bg-black/50 border-b border-white/5 overflow-hidden flex items-center" style={{ height: "32px" }}>
      <style>{`
        @keyframes pulls-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pulls-ticker-track {
          animation: pulls-ticker ${duration}s linear infinite;
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
        }
        .pulls-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* LIVE 뱃지 */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 border-r border-white/10 h-full bg-black/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LIVE</span>
      </div>

      <div className="overflow-hidden flex-1">
        <div className="pulls-ticker-track">
          {items.map((pull, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-5 text-xs whitespace-nowrap">
              <span className="text-gray-500">{pull.nickname}님이</span>
              <span className={
                pull.rarity === "MUR"
                  ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400"
                  : "font-bold text-yellow-300"
              }>
                {pull.cardName}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                pull.rarity === "MUR"
                  ? "bg-yellow-400/20 text-yellow-200"
                  : "bg-yellow-500/15 text-yellow-400"
              }`}>
                {pull.rarity}
              </span>
              <span className="text-gray-600">획득</span>
              <span className="text-white/10 ml-3">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
