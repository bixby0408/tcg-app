"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OwnedCard } from "../page";
import { discardCard } from "../actions";

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

  const filtered = ownedCards
    .filter((oc) => rarityFilter === "전체" || oc.card.rarity === rarityFilter)
    .sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.latestAcquiredAt.localeCompare(a.latestAcquiredAt);
        case "rarity":
          return (RARITY_ORDER[b.card.rarity] ?? 0) - (RARITY_ORDER[a.card.rarity] ?? 0);
        case "name":
          return a.card.name.localeCompare(b.card.name, "ko");
        case "count":
          return b.count - a.count;
        case "price":
          return b.card.current_price - a.card.current_price;
      }
    });

  const uniqueCount = ownedCards.length;

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
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">보유 코인</p>
              <p className="text-lg font-bold text-violet-600">{balance.toLocaleString()} C</p>
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
              <CardItem key={oc.card.id} oc={oc} onSelect={() => setSelectedCard(oc)} />
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
  const { card, count } = oc;
  const fallbackGradient = RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400";
  const badgeCls = RARITY_BADGE[card.rarity] ?? "bg-gray-100 text-gray-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col sm:flex-row gap-6 bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-sm"
        >
          ✕
        </button>

        {/* 카드 이미지 */}
        <div className="w-full sm:w-44 shrink-0">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg">
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
                <span className="text-white text-4xl font-black opacity-60">{card.rarity}</span>
              </div>
            )}
          </div>
        </div>

        {/* 카드 정보 */}
        <div className="flex-1 flex flex-col gap-3 pt-1">
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeCls}`}>
              {card.rarity}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{card.name}</h2>
          </div>

          <div className="space-y-1.5 text-sm">
            {card.card_type && (
              <div className="flex justify-between text-gray-500">
                <span>타입</span>
                <span className="font-medium text-gray-800 capitalize">{card.card_type}</span>
              </div>
            )}
            {card.series && (
              <div className="flex justify-between text-gray-500">
                <span>시리즈</span>
                <span className="font-medium text-gray-800">{card.series}</span>
              </div>
            )}
            {card.card_number && (
              <div className="flex justify-between text-gray-500">
                <span>카드 번호</span>
                <span className="font-medium text-gray-800">{card.card_number}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>보유 수량</span>
              <span className="font-bold text-gray-900">×{count}</span>
            </div>
          </div>

          {card.current_price > 0 && (
            <div className="mt-auto pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">현재 시세</p>
              <p className="text-2xl font-bold text-violet-600">{card.current_price.toLocaleString()} C</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardItem({ oc, onSelect }: { oc: OwnedCard; onSelect: () => void }) {
  const { card, count } = oc;
  const [confirming, setConfirming] = useState(false);
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const badgeCls = RARITY_BADGE[card.rarity] ?? "bg-gray-100 text-gray-600";
  const fallbackGradient = RARITY_FALLBACK[card.rarity] ?? "from-gray-300 to-gray-400";

  function openConfirm() {
    setQty(1);
    setConfirming(true);
  }

  function handleDiscard() {
    startTransition(async () => {
      await discardCard(card.id, qty);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="group relative cursor-default">
      {/* 카드 본체 */}
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 cursor-pointer"
        onClick={() => { if (!confirming) onSelect(); }}
      >
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
            <span className="text-white text-2xl font-black opacity-60">
              {card.rarity}
            </span>
          </div>
        )}

        {/* 하단 그라디언트 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

        {/* 카드 이름 + 희귀도 */}
        <div className="absolute inset-x-0 bottom-0 p-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeCls}`}>
            {RARITY_LABEL[card.rarity] ?? card.rarity}
          </span>
          <p className="text-white text-[11px] font-semibold mt-0.5 leading-tight line-clamp-2">
            {card.name}
          </p>
        </div>

        {/* 중복 뱃지 */}
        {count > 1 && !confirming && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            ×{count}
          </div>
        )}

        {/* 버리기 버튼 (호버 시) */}
        {!confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); openConfirm(); }}
            className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-500/80 text-white rounded-lg p-1 text-xs"
            title="버리기"
          >
            🗑
          </button>
        )}

        {/* 확인 오버레이 */}
        {confirming && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 p-3">
            <p className="text-white text-[11px] font-semibold text-center">버릴 수량</p>

            {/* 수량 조절 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={isPending}
                className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={count}
                value={qty}
                onChange={(e) => setQty(Math.min(count, Math.max(1, Number(e.target.value))))}
                disabled={isPending}
                className="w-10 text-center bg-white/20 text-white text-[12px] font-bold rounded-md py-0.5 border border-white/30 focus:outline-none"
              />
              <button
                onClick={() => setQty((q) => Math.min(count, q + 1))}
                disabled={isPending}
                className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="text-white/50 text-[10px]">보유 {count}장</p>

            <div className="flex gap-1.5">
              <button
                onClick={handleDiscard}
                disabled={isPending}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                {isPending ? "..." : "버리기"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 시세 */}
      {card.current_price > 0 && (
        <p className="text-[11px] text-center text-gray-400 mt-1">
          {card.current_price.toLocaleString()} C
        </p>
      )}
    </div>
  );
}
