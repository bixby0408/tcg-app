"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Listing, MyCard } from "../page";
import { buyCard, cancelListing, listCard, getCardPriceHistory } from "../actions";
import PriceChart from "./PriceChart";

const RARITIES = ["전체", "N", "R", "RR", "AR", "SR", "SAR", "UR", "MUR"] as const;

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

type SortKey = "newest" | "price_asc" | "price_desc";

export default function MarketClient({
  listings,
  myCards,
  balance,
}: {
  listings: Listing[];
  myCards: MyCard[];
  balance: number;
  userId: string;
}) {
  const [tab, setTab] = useState<"all" | "mine" | "sell">("all");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const myListings = listings.filter((l) => l.isMine);

  function showMsg(type: "error" | "success", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">마켓플레이스</h1>
          <p className="text-sm text-gray-400 mt-0.5">카드를 사고팔아 컬렉션을 완성하세요</p>
        </div>
        <div className="text-right bg-white border border-gray-100 rounded-2xl px-5 py-3">
          <p className="text-xs text-gray-400">보유 코인</p>
          <p className="text-xl font-bold text-violet-600">{balance.toLocaleString()} C</p>
        </div>
      </div>

      {/* 알림 */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.text}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit">
        {([
          { key: "all",  label: `전체 마켓 (${listings.length})` },
          { key: "mine", label: `내 판매 중 (${myListings.length})` },
          { key: "sell", label: "판매하기" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "all"  && <AllTab  listings={listings}   onMsg={showMsg} />}
      {tab === "mine" && <MineTab listings={myListings} onMsg={showMsg} />}
      {tab === "sell" && (
        <SellTab
          myCards={myCards}
          balance={balance}
          onMsg={showMsg}
          onDone={() => setTab("mine")}
        />
      )}
    </div>
  );
}

/* ─────────────── 전체 마켓 ─────────────── */
function AllTab({
  listings,
  onMsg,
}: {
  listings: Listing[];
  onMsg: (type: "error" | "success", text: string) => void;
}) {
  const [rarityFilter, setRarityFilter] = useState("전체");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = listings
    .filter((l) => rarityFilter === "전체" || l.card.rarity === rarityFilter)
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                rarityFilter === r
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-violet-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="newest">최신순</option>
          <option value="price_asc">가격 낮은순</option>
          <option value="price_desc">가격 높은순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text={rarityFilter === "전체" ? "판매 중인 카드가 없어요" : `${rarityFilter} 등급 판매글이 없어요`} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onMsg={onMsg} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── 내 판매 중 ─────────────── */
function MineTab({
  listings,
  onMsg,
}: {
  listings: Listing[];
  onMsg: (type: "error" | "success", text: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel(listingId: string) {
    startTransition(async () => {
      const res = await cancelListing(listingId);
      if (res.error) onMsg("error", res.error);
      else { onMsg("success", "판매가 취소됐어요"); router.refresh(); }
    });
  }

  if (listings.length === 0) {
    return <EmptyState text="판매 중인 카드가 없어요" />;
  }

  return (
    <div className="space-y-3">
      {listings.map((l) => (
        <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
            {l.card.image_url ? (
              <img src={l.card.image_url} alt={l.card.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[l.card.rarity] ?? "from-gray-300 to-gray-400"}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${RARITY_BADGE[l.card.rarity] ?? "bg-gray-100 text-gray-600"}`}>
                {l.card.rarity}
              </span>
              <p className="text-sm font-semibold text-gray-900 truncate">{l.card.name}</p>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(l.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 등록
            </p>
            {l.card.current_price > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                시세{" "}
                <span className="font-medium text-gray-600">{l.card.current_price.toLocaleString()} C</span>
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-base font-bold text-violet-600">{l.price.toLocaleString()} C</p>
            <button
              onClick={() => handleCancel(l.id)}
              disabled={isPending}
              className="mt-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── 판매하기 (마켓 판매 / 즉시 판매) ─────────────── */
function SellTab({
  myCards,
  balance,
  onMsg,
  onDone,
}: {
  myCards: MyCard[];
  balance: number;
  onMsg: (type: "error" | "success", text: string) => void;
  onDone: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [price, setPrice] = useState("");
  const [isPending, startTransition] = useTransition();
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number; transaction_type: "market_buy" | "instant_sell"; created_at: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rarityFilter, setRarityFilter] = useState("전체");
  const router = useRouter();

  const selected = myCards.find((c) => c.userCardId === selectedId);

  useEffect(() => {
    if (!selected) { setPriceHistory([]); return; }
    setLoadingHistory(true);
    getCardPriceHistory(selected.card.id).then((data) => {
      setPriceHistory(data as Array<{ price: number; transaction_type: "market_buy" | "instant_sell"; created_at: string }>);
      setLoadingHistory(false);
    });
  }, [selected?.card.id]);

  const marketPrice = selected?.card.current_price ?? 0;
  const priceNum = Number(price);
  const pricePct = marketPrice > 0 && priceNum > 0
    ? Math.round(((priceNum - marketPrice) / marketPrice) * 100)
    : null;

  const ownedRarities = [...new Set(myCards.map((c) => c.card.rarity))];
  const filteredCards = rarityFilter === "전체"
    ? myCards
    : myCards.filter((c) => c.card.rarity === rarityFilter);

  function handleSelect(id: string) {
    setSelectedId((prev) => prev === id ? "" : id);
    setPrice("");
  }

  function handleMarketSell() {
    if (!selectedId || !price || priceNum <= 0) return;
    startTransition(async () => {
      const res = await listCard(selectedId, priceNum);
      if (res.error) onMsg("error", res.error);
      else {
        onMsg("success", "판매 등록이 완료됐어요!");
        setSelectedId(""); setPrice("");
        router.refresh(); onDone();
      }
    });
  }

  if (myCards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="text-4xl mb-3">🃏</div>
        <p className="text-gray-500 font-medium">판매할 카드가 없어요</p>
        <p className="text-sm text-gray-400 mt-1">팩을 뽑아 카드를 획득해보세요</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 카드 선택 그리드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">판매할 카드 선택</p>
          {selected && (
            <button
              onClick={() => handleSelect(selectedId)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              선택 해제
            </button>
          )}
        </div>

        {/* 등급 필터 */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {["전체", ...ownedRarities].map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                rarityFilter === r
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {r} {r !== "전체" && `(${myCards.filter((c) => c.card.rarity === r).length})`}
            </button>
          ))}
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredCards.map((c) => {
            const isSelected = c.userCardId === selectedId;
            return (
              <button
                key={c.userCardId}
                onClick={() => handleSelect(c.userCardId)}
                className={`relative rounded-xl overflow-hidden aspect-[2/3] transition-all focus:outline-none ${
                  isSelected
                    ? "ring-2 ring-violet-500 ring-offset-1 scale-[1.03] shadow-lg shadow-violet-200"
                    : "hover:scale-[1.02] hover:shadow-md opacity-80 hover:opacity-100"
                }`}
              >
                {c.card.image_url ? (
                  <img src={c.card.image_url} alt={c.card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[c.card.rarity] ?? "from-gray-300 to-gray-400"}`} />
                )}
                {/* 오버레이 */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 inset-x-1">
                  <span className={`text-[8px] px-1 py-0.5 rounded-full font-bold ${RARITY_BADGE[c.card.rarity] ?? "bg-gray-100 text-gray-600"}`}>
                    {c.card.rarity}
                  </span>
                  <p className="text-white text-[9px] font-semibold mt-0.5 line-clamp-2 leading-tight">{c.card.name}</p>
                </div>
                {/* 선택 체크 */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400">해당 등급의 카드가 없어요</div>
        )}
      </div>

      {/* 선택된 카드 상세 + 액션 */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {/* 선택 카드 요약 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
              {selected.card.image_url ? (
                <img src={selected.card.image_url} alt={selected.card.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[selected.card.rarity] ?? "from-gray-300 to-gray-400"}`} />
              )}
            </div>
            <div className="flex-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${RARITY_BADGE[selected.card.rarity] ?? "bg-gray-100"}`}>
                {selected.card.rarity}
              </span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{selected.card.name}</p>
              {marketPrice > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  현재 시세: <span className="font-semibold text-gray-700">{marketPrice.toLocaleString()} C</span>
                </p>
              )}
            </div>
          </div>

          {/* 시세 차트 */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            {loadingHistory ? (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-gray-400">차트 로딩 중...</p>
              </div>
            ) : (
              <PriceChart history={priceHistory} chartId={selected.card.id} />
            )}
          </div>

          {/* ── 마켓 판매 ── */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">판매 가격 (코인)</label>
            <div className="relative">
              <input
                type="number" min="1" step="1" value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">C</span>
            </div>
            {pricePct !== null && (
              <p className={`text-xs mt-1.5 font-medium ${
                pricePct > 10 ? "text-orange-500" :
                pricePct < -10 ? "text-blue-500" :
                "text-green-600"
              }`}>
                {pricePct > 0 ? `시세보다 ${pricePct}% 높음` :
                 pricePct < 0 ? `시세보다 ${Math.abs(pricePct)}% 낮음` :
                 "시세와 동일"}
              </p>
            )}
          </div>
          <button
            onClick={handleMarketSell}
            disabled={isPending || !price || priceNum <= 0}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {isPending ? "등록 중..." : "판매 등록"}
          </button>
        </div>
      )}

      {!selected && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-400">위에서 카드를 선택하면 판매 옵션이 표시됩니다</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────── 개별 리스팅 카드 ─────────────── */
function ListingCard({
  listing,
  onMsg,
}: {
  listing: Listing;
  onMsg: (type: "error" | "success", text: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const marketPrice = listing.card.current_price ?? 0;
  const priceDiffPct = marketPrice > 0
    ? Math.round(((listing.price - marketPrice) / marketPrice) * 100)
    : null;

  function handleBuy() {
    startTransition(async () => {
      const res = await buyCard(listing.id);
      if (res.error) { onMsg("error", res.error); setConfirming(false); }
      else { onMsg("success", `${listing.card.name}을(를) 구매했어요!`); router.refresh(); }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 카드 이미지 */}
      <div className="relative aspect-[2/3]">
        {listing.card.image_url ? (
          <img src={listing.card.image_url} alt={listing.card.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${RARITY_FALLBACK[listing.card.rarity] ?? "from-gray-300 to-gray-400"} flex items-center justify-center`}>
            <span className="text-white text-xl font-black opacity-50">{listing.card.rarity}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 inset-x-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${RARITY_BADGE[listing.card.rarity] ?? "bg-gray-100 text-gray-600"}`}>
            {listing.card.rarity}
          </span>
          <p className="text-white text-[10px] font-semibold mt-0.5 line-clamp-2 leading-tight">{listing.card.name}</p>
        </div>

        {listing.isMine && (
          <div className="absolute top-2 right-2 bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            내 판매
          </div>
        )}

        {/* 시세 대비 배지 */}
        {priceDiffPct !== null && !listing.isMine && Math.abs(priceDiffPct) >= 10 && (
          <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            priceDiffPct > 0 ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
          }`}>
            {priceDiffPct > 0 ? `+${priceDiffPct}%` : `${priceDiffPct}%`}
          </div>
        )}
      </div>

      {/* 가격 + 액션 */}
      <div className="p-3">
        <p className="text-xs text-gray-700 truncate mb-1 font-semibold">👤 {listing.seller_nickname}</p>
        <p className="text-base font-bold text-violet-600">{listing.price.toLocaleString()} C</p>
        {marketPrice > 0 && (
          <p className="text-[10px] text-gray-400 mb-2">
            시세 {marketPrice.toLocaleString()} C
          </p>
        )}

        {listing.isMine ? (
          <div className="text-[11px] text-center text-gray-400 py-1">판매 중</div>
        ) : confirming ? (
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-500 text-center">{listing.price.toLocaleString()} C 차감</p>
            <div className="flex gap-1">
              <button
                onClick={handleBuy}
                disabled={isPending}
                className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                {isPending ? "..." : "확인"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold rounded-lg transition-colors"
          >
            구매
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────── 공통 ─────────────── */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-gray-400">
      <div className="text-5xl mb-3">🏪</div>
      <p className="text-base font-medium">{text}</p>
    </div>
  );
}
