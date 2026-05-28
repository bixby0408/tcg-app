"use client";

type PricePoint = {
  price: number;
  transaction_type: "market_buy" | "instant_sell";
  created_at: string;
};

export default function PriceChart({
  history,
  chartId = "chart",
}: {
  history: PricePoint[];
  chartId?: string;
}) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-20 gap-1">
        <p className="text-xs text-gray-400 font-medium">거래 이력 없음</p>
        <p className="text-[10px] text-gray-300">거래가 발생하면 차트가 표시됩니다</p>
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || Math.max(maxP * 0.2, 1);

  const W = 280;
  const H = 72;
  const PX = 8;
  const PY = 10;

  const pts = history.map((h, i) => ({
    x: PX + (history.length > 1 ? i / (history.length - 1) : 0.5) * (W - PX * 2),
    y: PY + ((maxP - h.price) / range) * (H - PY * 2),
    price: h.price,
    type: h.transaction_type,
  }));

  const first = pts[0];
  const last = pts[pts.length - 1];
  const trending = last.price >= first.price;
  const lineColor = trending ? "#22c55e" : "#ef4444";
  const diff = Math.abs(last.price - first.price);
  const diffPct = first.price > 0 ? Math.round((diff / first.price) * 100) : 0;

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const fillD = `${pathD} L ${last.x.toFixed(1)} ${H} L ${first.x.toFixed(1)} ${H} Z`;
  const gradId = `sg-${chartId}`;

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">시세 변동 차트</p>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trending ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {trending ? "▲" : "▼"} {diffPct}%
        </span>
      </div>

      {/* SVG 차트 */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fillD} fill={`url(#${gradId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={p.type === "instant_sell" ? "#f59e0b" : "#8b5cf6"}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* 통계 + 범례 */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
        <span>
          최고{" "}
          <span className="font-semibold text-gray-700">{maxP.toLocaleString()} C</span>
        </span>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
            마켓구매
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            즉시판매
          </span>
        </div>
        <span>
          최저{" "}
          <span className="font-semibold text-gray-700">{minP.toLocaleString()} C</span>
        </span>
      </div>
    </div>
  );
}
