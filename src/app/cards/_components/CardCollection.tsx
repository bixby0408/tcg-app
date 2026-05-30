"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OwnedCard } from "../page";
import { sellCard, bulkSellCards } from "../actions";

const RARITIES = ["전체", "N", "R", "RR", "AR", "SR", "SAR", "UR", "MUR"] as const;

const RARITY_LABEL: Record<string, string> = {
  N: "N", R: "R", RR: "RR", AR: "AR", SR: "SR", SAR: "SAR", UR: "UR", MUR: "MUR",
};

const RARITY_ORDER: Record<string, number> = {
  N: 0, R: 1, RR: 2, AR: 3, SR: 4, SAR: 5, UR: 6, MUR: 7,
};

const RARITY_BADGE: Record<string, string> = {
  N:   "bg-gray-100 text-gray-600",
  R:   "bg-blue-100 text-blue-700",
  RR:  "bg-violet-100 text-violet-700",
  AR:  "bg-rose-100 text-rose-700",
  SR:  "bg-orange-100 text-orange-700",
  SAR: "bg-amber-100 text-amber-800",
  UR:  "bg-yellow-100 text-yellow-800",
  MUR: "bg-gradient-to-r from-yellow-200 to-amber-200 text-yellow-900",
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

type SortKey = "newest" | "rarity" | "name" | "count" | "price";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",  label: "최신 획득순" },
  { value: "rarity",  label: "희귀도순" },
  { value: "name",    label: "이름순" },
  { value: "count",   label: "보유 수량순" },
  { value: "price",   label: "시세 높은순" },
];

export default function CardCollection({
  ownedCards,
  totalCount,
  balance,
  nickname,
}: {
  ownedCards: OwnedCard[];
  totalCount: number;
  balance: number;
  nickname: string;
}) {
  const [rarityFilter, setRarityFilter] = useState<string>("전체");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  // cardId → quantity to sell
  const [bulkSelected, setBulkSelected] = useState<Map<string, number>>(new Map());
  const [bulkPending, startBulkTransition] = useTransition();
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const router = useRouter();

  const filtered = ownedCards
    .filter((oc) => rarityFilter === "전체" || oc.card.rarity === rarityFilter)
    .sort((a, b) => {
      switch (sort) {
        case "newest": return b.latestAcquiredAt.localeCompare(a.latestAcquiredAt);
        case "rarity": return (RARITY_ORDER[b.card.rarity] ?? 0) - (RARITY_ORDER[a.card.rarity] ?? 0);
        case "name":   return a.card.name.localeCompare(b.card.name, "ko");
        case "count":  return b.count - a.count;
        case "price":  return b.card.current_price - a.card.current_price;
      }
    });

  const uniqueCount = ownedCards.length;

  function toggleBulkCard(cardId: string, maxCount: number) {
    setBulkSelected((prev) => {
      const next = new Map(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.set(cardId, 1);
      }
      return next;
    });
  }

  function setBulkQty(cardId: string, qty: number, maxCount: number) {
    setBulkSelected((prev) => {
      const next = new Map(prev);
      const clamped = Math.max(1, Math.min(maxCount, qty));
      next.set(cardId, clamped);
      return next;
    });
  }

  const bulkTotalEarned = Array.from(bulkSelected.entries()).reduce((sum, [cardId, qty]) => {
    const oc = ownedCards.find((o) => o.card.id === cardId);
    return sum + Math.floor((oc?.card.current_price ?? 0) * 0.85) * qty;
  }, 0);

  function handleBulkSell() {
    const items = Array.from(bulkSelected.entries()).map(([cardId, quantity]) => ({ cardId, quantity }));
    startBulkTransition(async () => {
      const result = await bulkSellCards(items);
      if (result.error) {
        setBulkResult(`오류: ${result.error}`);
      } else {
        setBulkResult(`${(result.totalEarned ?? 0).toLocaleString()} C 획득!`);
        setBulkSelected(new Map());
        setBulkMode(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 컬렉션</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {uniqueCount}종 · 총 {totalCount}장 보유
                {totalCount >= 900 && (
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${totalCount >= 1000 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                    {totalCount >= 1000 ? "한도 초과 ⚠️" : `${totalCount}/1000`}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBulkMode((v) => !v);
                  setBulkSelected(new Map());
                  setBulkResult(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  bulkMode
                    ? "bg-violet-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {bulkMode ? "선택 취소" : "일괄판매"}
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-400">보유 코인</p>
                <p className="text-lg font-bold text-violet-600">{balance.toLocaleString()} C</p>
              </div>
            </div>
          </div>

          {/* 희귀도 필터 */}
          <div className="flex gap-1.5 mt-5 flex-wrap">
            {RARITIES.map((r) => {
              const count = r === "전체"
                ? ownedCards.length
                : ownedCards.filter((oc) => oc.card.rarity === r).length;
              return (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    rarityFilter === r
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {r} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일괄판매 바 */}
      {bulkMode && (
        <div className="sticky top-0 z-30 bg-violet-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="text-sm">
            <span className="font-semibold">{bulkSelected.size}종</span> 선택
            {bulkSelected.size > 0 && (
              <span className="ml-3 text-violet-200">예상 수령: <span className="text-white font-bold">{bulkTotalEarned.toLocaleString()} C</span></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {bulkResult && (
              <span className="text-sm text-violet-200 mr-2">{bulkResult}</span>
            )}
            <button
              onClick={handleBulkSell}
              disabled={bulkSelected.size === 0 || bulkPending}
              className="px-4 py-1.5 bg-white text-violet-700 font-bold text-sm rounded-xl disabled:opacity-40 hover:bg-violet-50 transition-colors"
            >
              {bulkPending ? "판매 중..." : "일괄 즉시판매"}
            </button>
          </div>
        </div>
      )}

      {/* 정렬 + 그리드 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{filtered.length}종 표시 중</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-base font-medium">
              {rarityFilter === "전체" ? "아직 카드가 없어요" : `${rarityFilter} 등급 카드가 없어요`}
            </p>
            <p className="text-sm mt-1">팩을 뽑아 컬렉션을 채워보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filtered.map((oc) => (
              <CardItem
                key={oc.card.id}
                oc={oc}
                onSelect={() => { if (!bulkMode) setSelectedCard(oc); }}
                bulkMode={bulkMode}
                bulkQty={bulkSelected.get(oc.card.id)}
                onBulkToggle={() => toggleBulkCard(oc.card.id, oc.count)}
                onBulkQtyChange={(q) => setBulkQty(oc.card.id, q, oc.count)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCard && (
        <CardModal oc={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

function CardModal({ oc, onClose }: { oc: OwnedCard; onClose: () => void }) {
  const { card } = oc;
  const fallbackGradient = RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] aspect-[2/3]" onClick={(e) => e.stopPropagation()}>
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className="h-full w-full object-cover rounded-2xl shadow-2xl" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${fallbackGradient} rounded-2xl flex items-center justify-center`}>
            <span className="text-white text-6xl font-black opacity-60">{card.rarity}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CardItem({
  oc,
  onSelect,
  bulkMode,
  bulkQty,
  onBulkToggle,
  onBulkQtyChange,
}: {
  oc: OwnedCard;
  onSelect: () => void;
  bulkMode: boolean;
  bulkQty: number | undefined;
  onBulkToggle: () => void;
  onBulkQtyChange: (q: number) => void;
}) {
  const { card, count } = oc;
  const [confirming, setConfirming] = useState(false);
  const [qty, setQty] = useState(1);
  const [qtyStr, setQtyStr] = useState("1");
  const [isPending, startTransition] = useTransition();
  const [sellResult, setSellResult] = useState<string | null>(null);
  const router = useRouter();

  const badgeCls = RARITY_BADGE[card.rarity] ?? "bg-gray-100 text-gray-600";
  const fallbackGradient = RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400";
  const earnPerCard = Math.floor(card.current_price * 0.85);
  const isSelected = bulkQty !== undefined;

  function openConfirm() {
    setQty(1);
    setQtyStr("1");
    setSellResult(null);
    setConfirming(true);
  }

  function handleSell() {
    startTransition(async () => {
      const result = await sellCard(card.id, qty);
      if (result.error) {
        setSellResult(`오류: ${result.error}`);
      } else {
        setSellResult(`+${(result.earned ?? 0).toLocaleString()} C`);
        setTimeout(() => {
          setConfirming(false);
          setSellResult(null);
          router.refresh();
        }, 1200);
      }
    });
  }

  if (bulkMode) {
    return (
      <div
        className={`group relative cursor-pointer`}
        onClick={onBulkToggle}
      >
        <div className={`relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${isSelected ? "ring-2 ring-violet-500 scale-105" : "hover:scale-102 opacity-80"}`}>
          {card.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
              <span className="text-white text-2xl font-black opacity-60">{card.rarity}</span>
            </div>
          )}
          {isSelected && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
          {count > 1 && (
            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              ×{count}
            </div>
          )}
        </div>
        {isSelected && (
          <div className="flex items-center justify-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onBulkQtyChange((bulkQty ?? 1) - 1)} className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold">−</button>
            <input
              type="number"
              min={1}
              max={count}
              value={bulkQty ?? 1}
              onChange={(e) => {
                const n = parseInt(e.target.value);
                if (!isNaN(n) && n >= 1) onBulkQtyChange(n);
              }}
              onBlur={(e) => {
                const n = parseInt(e.target.value) || 1;
                onBulkQtyChange(n);
              }}
              className="w-10 text-center bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <button onClick={() => onBulkQtyChange((bulkQty ?? 1) + 1)} className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold">+</button>
          </div>
        )}
        {/* 카드 이름 + 등급 (카드 아래) */}
        <div className="mt-1.5 px-0.5">
          <div className="flex items-center gap-1 justify-center">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${badgeCls}`}>
              {RARITY_LABEL[card.rarity] ?? card.rarity}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-800 text-center leading-tight line-clamp-2 mt-0.5">
            {card.name}
          </p>
          {earnPerCard > 0 && (
            <p className="text-[10px] text-center text-gray-400 mt-0.5">{earnPerCard.toLocaleString()} C</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative cursor-default">
      {/* 카드 이미지 */}
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-200 cursor-pointer"
        onClick={() => { if (!confirming) onSelect(); }}
      >
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
            <span className="text-white text-2xl font-black opacity-60">{card.rarity}</span>
          </div>
        )}

        {/* 수량 배지 */}
        {count > 1 && !confirming && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            ×{count}
          </div>
        )}

        {/* 판매 버튼 (호버 시) */}
        {!confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); openConfirm(); }}
            className="absolute inset-x-0 bottom-0 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-violet-700/90 text-white text-[11px] font-bold"
          >
            판매
          </button>
        )}

        {/* 판매 확인 오버레이 */}
        {confirming && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 p-3">
            {sellResult ? (
              <p className={`text-sm font-bold ${sellResult.startsWith("오류") ? "text-red-400" : "text-green-400"}`}>
                {sellResult}
              </p>
            ) : (
              <>
                <p className="text-violet-300 text-[10px]">시세 {card.current_price.toLocaleString()} C</p>
                <p className="text-amber-300 text-[12px] font-bold">→ {(earnPerCard * qty).toLocaleString()} C</p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { const n = Math.max(1, qty - 1); setQty(n); setQtyStr(String(n)); }}
                    disabled={isPending}
                    className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-40"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={count}
                    value={qtyStr}
                    onChange={(e) => {
                      setQtyStr(e.target.value);
                      const n = parseInt(e.target.value);
                      if (!isNaN(n) && n >= 1) setQty(Math.min(count, n));
                    }}
                    onBlur={() => {
                      const n = Math.min(count, Math.max(1, parseInt(qtyStr) || 1));
                      setQty(n);
                      setQtyStr(String(n));
                    }}
                    disabled={isPending}
                    className="w-12 text-center bg-white/20 text-white text-[12px] font-bold rounded-md py-0.5 border border-white/30 focus:outline-none focus:border-white/60"
                  />
                  <button
                    onClick={() => { const n = Math.min(count, qty + 1); setQty(n); setQtyStr(String(n)); }}
                    disabled={isPending}
                    className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-40"
                  >+</button>
                </div>
                <p className="text-white/40 text-[10px]">보유 {count}장</p>

                <div className="flex gap-1.5">
                  <button
                    onClick={handleSell}
                    disabled={isPending}
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors"
                  >
                    {isPending ? "..." : "판매"}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isPending}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 카드 이름 + 등급 (카드 아래) */}
      <div className="mt-1.5 px-0.5">
        <div className="flex items-center gap-1 justify-center">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${badgeCls}`}>
            {RARITY_LABEL[card.rarity] ?? card.rarity}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-800 text-center leading-tight line-clamp-2 mt-0.5">
          {card.name}
        </p>
        {card.current_price > 0 && (
          <p className="text-[10px] text-center text-gray-400 mt-0.5">
            {card.current_price.toLocaleString()} C
          </p>
        )}
      </div>
    </div>
  );
}
