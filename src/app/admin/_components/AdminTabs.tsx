"use client";

import { useState, useActionState } from "react";
import { createCard, createPack, addCardToPack, removeCardFromPack, deletePack, deleteCard, updateCardPrice, updatePackPrice, createDexSet, deleteDexSet, addCardToDexSet, removeCardFromDexSet } from "../actions";
import { createClient } from "@/lib/supabase/client";

type Rarity = "N" | "R" | "RR" | "AR" | "SR" | "SAR" | "UR" | "MUR";

type Card = {
  id: string;
  name: string;
  rarity: Rarity;
  card_type: string | null;
  card_number: string | null;
  series: string | null;
  current_price: number;
  image_url: string | null;
  description: string | null;
};

type Pack = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cards_per_pack: number;
  is_active: boolean;
  release_date: string | null;
};

type PackCard = {
  pack_id: string;
  card_id: string;
  weight: number;
  cards: { name: string; rarity: Rarity } | null;
};

type DexSet = {
  id: string;
  name: string;
  description: string | null;
  reward_description: string | null;
  created_at: string;
};

type DexSetCard = {
  set_id: string;
  card_id: string;
  cards: { name: string; rarity: Rarity; image_url: string | null } | null;
};

const RARITY_LABEL: Record<Rarity, string> = {
  N:   "N 일반",
  R:   "R 레어",
  RR:  "RR 더블레어",
  AR:  "AR 아트레어",
  SR:  "SR 슈퍼레어",
  SAR: "SAR 스페셜아트레어",
  UR:  "UR 울트라레어",
  MUR: "MUR 마스터울트라레어",
};

const RARITY_COLOR: Record<Rarity, string> = {
  N:   "bg-gray-100 text-gray-600",
  R:   "bg-blue-100 text-blue-700",
  RR:  "bg-violet-100 text-violet-700",
  AR:  "bg-rose-100 text-rose-700",
  SR:  "bg-orange-100 text-orange-700",
  SAR: "bg-amber-100 text-amber-700",
  UR:  "bg-yellow-100 text-yellow-800",
  MUR: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-900",
};

export default function AdminTabs({
  cards,
  packs,
  packCards,
  dexSets,
  dexSetCards,
}: {
  cards: Card[];
  packs: Pack[];
  packCards: PackCard[];
  dexSets: DexSet[];
  dexSetCards: DexSetCard[];
}) {
  const [tab, setTab] = useState<"cards" | "packs" | "composition" | "dex">("cards");

  const TAB_LABELS: Record<typeof tab, string> = {
    cards: "카드 관리",
    packs: "팩 관리",
    composition: "팩 구성",
    dex: "도감 관리",
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["cards", "packs", "composition", "dex"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "cards" && <CardsTab cards={cards} />}
      {tab === "packs" && <PacksTab packs={packs} />}
      {tab === "composition" && (
        <CompositionTab packs={packs} cards={cards} packCards={packCards} />
      )}
      {tab === "dex" && (
        <DexTab cards={cards} dexSets={dexSets} dexSetCards={dexSetCards} />
      )}
    </div>
  );
}

/* ─────────────── 가격 인라인 수정 ─────────────── */
function PriceEditor({ card }: { card: Card }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(card.current_price));
  const [priceState, priceAction, pricePending] = useActionState(updateCardPrice, null);

  if (editing) {
    return (
      <form action={priceAction} className="flex items-center gap-1" onSubmit={() => setEditing(false)}>
        <input type="hidden" name="card_id" value={card.id} />
        <input
          name="price"
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-violet-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={pricePending}
          className="text-xs text-white bg-violet-600 hover:bg-violet-700 px-2 py-1 rounded-lg transition-colors"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => { setValue(String(card.current_price)); setEditing(false); }}
          className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-xs text-gray-400 hover:text-violet-600 hover:underline transition-colors cursor-pointer"
      title="클릭해서 가격 수정"
    >
      {priceState?.success ? Number(value).toLocaleString() : card.current_price.toLocaleString()} 코인 ✎
    </button>
  );
}

/* ─────────────── 팩 가격 인라인 수정 ─────────────── */
function PackPriceEditor({ pack }: { pack: Pack }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(pack.price));
  const [priceState, priceAction, pricePending] = useActionState(updatePackPrice, null);

  if (editing) {
    return (
      <form action={priceAction} className="flex items-center gap-1" onSubmit={() => setEditing(false)}>
        <input type="hidden" name="pack_id" value={pack.id} />
        <input
          name="price"
          type="number"
          min="1"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-violet-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={pricePending}
          className="text-xs text-white bg-violet-600 hover:bg-violet-700 px-2 py-1 rounded-lg transition-colors"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => { setValue(String(pack.price)); setEditing(false); }}
          className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-xs text-gray-400 hover:text-violet-600 hover:underline transition-colors cursor-pointer"
      title="클릭해서 가격 수정"
    >
      {priceState?.success ? Number(value).toLocaleString() : pack.price.toLocaleString()} 코인 ✎
    </button>
  );
}

/* ─────────────── 카드 관리 탭 ─────────────── */
function CardsTab({ cards }: { cards: Card[] }) {
  const [state, action, pending] = useActionState(createCard, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCard, null);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* 등록 폼 */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">카드 등록</h2>
        <form action={action} className="space-y-3">
          <Field label="카드 이름 *">
            <input name="name" required placeholder="아쿠아 드래곤" className={inputCls} />
          </Field>
          <Field label="희귀도 *">
            <select name="rarity" required className={inputCls}>
              <option value="">선택</option>
              {(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => (
                <option key={r} value={r}>{RARITY_LABEL[r]}</option>
              ))}
            </select>
          </Field>
          <Field label="타입">
            <input name="card_type" placeholder="fire, water, grass ..." className={inputCls} />
          </Field>
          <Field label="카드 번호">
            <input name="card_number" placeholder="001/150" className={inputCls} />
          </Field>
          <Field label="시리즈">
            <input name="series" placeholder="1기 베이스" className={inputCls} />
          </Field>
          <Field label="설명">
            <textarea name="description" rows={2} placeholder="카드 설명" className={inputCls} />
          </Field>
          <Field label="초기 시세 (코인)">
            <input name="current_price" type="number" min="0" step="0.01" defaultValue="0" className={inputCls} />
          </Field>
          <Field label="카드 이미지">
            <ImageUpload bucket="cards" label="카드 이미지" />
          </Field>

          {state?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}
          {state?.success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">카드가 등록됐습니다!</p>}

          <button type="submit" disabled={pending} className={submitCls}>
            {pending ? "등록 중..." : "카드 등록"}
          </button>
        </form>
      </div>

      {/* 카드 목록 */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">카드 목록 ({cards.length})</h2>
        {deleteState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{deleteState.error}</p>}
        {cards.length === 0 ? (
          <Empty text="등록된 카드가 없어요" />
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${RARITY_COLOR[card.rarity]}`}>
                    {RARITY_LABEL[card.rarity][0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.name}</p>
                    <p className="text-xs text-gray-400">
                      {[card.series, card.card_number, card.card_type].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RARITY_COLOR[card.rarity]}`}>
                      {RARITY_LABEL[card.rarity]}
                    </span>
                    <div className="mt-1">
                      <PriceEditor card={card} />
                    </div>
                  </div>
                  <form action={deleteAction}>
                    <input type="hidden" name="card_id" value={card.id} />
                    <button
                      type="submit"
                      disabled={deletePending}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── 팩 관리 탭 ─────────────── */
function PacksTab({ packs }: { packs: Pack[] }) {
  const [state, action, pending] = useActionState(createPack, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePack, null);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* 등록 폼 */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">팩 등록</h2>
        <form action={action} className="space-y-3">
          <Field label="팩 이름 *">
            <input name="name" required placeholder="1기 부스터팩" className={inputCls} />
          </Field>
          <Field label="설명">
            <textarea name="description" rows={2} placeholder="팩 설명" className={inputCls} />
          </Field>
          <Field label="가격 (코인) *">
            <input name="price" type="number" min="1" required placeholder="100" className={inputCls} />
          </Field>
          <Field label="팩당 카드 수">
            <input name="cards_per_pack" type="number" min="1" max="20" defaultValue="5" className={inputCls} />
          </Field>
          <Field label="출시일">
            <input name="release_date" type="date" className={inputCls} />
          </Field>
          <Field label="팩 커버 이미지">
            <ImageUpload bucket="packs" label="팩 이미지" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input name="is_active" type="checkbox" defaultChecked className="rounded" />
            판매 활성화
          </label>

          {state?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}
          {state?.success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">팩이 등록됐습니다!</p>}

          <button type="submit" disabled={pending} className={submitCls}>
            {pending ? "등록 중..." : "팩 등록"}
          </button>
        </form>
      </div>

      {/* 팩 목록 */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">팩 목록 ({packs.length})</h2>
        {deleteState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{deleteState.error}</p>}

        {packs.length === 0 ? (
          <Empty text="등록된 팩이 없어요" />
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {packs.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{pack.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-400">{pack.cards_per_pack}장 ·</span>
                    <PackPriceEditor pack={pack} />
                    {pack.release_date && <span className="text-xs text-gray-400">· {pack.release_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pack.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {pack.is_active ? "판매중" : "비활성"}
                  </span>
                  <form action={deleteAction}>
                    <input type="hidden" name="pack_id" value={pack.id} />
                    <button
                      type="submit"
                      disabled={deletePending}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── 팩 구성 탭 ─────────────── */
function CompositionTab({
  packs,
  cards,
  packCards,
}: {
  packs: Pack[];
  cards: Card[];
  packCards: PackCard[];
}) {
  const [selectedPackId, setSelectedPackId] = useState(packs[0]?.id ?? "");
  const [addState, addAction, addPending] = useActionState(addCardToPack, null);
  const [removeState, removeAction, removePending] = useActionState(removeCardFromPack, null);

  const currentPackCards = packCards.filter((pc) => pc.pack_id === selectedPackId);
  const currentCardIds = new Set(currentPackCards.map((pc) => pc.card_id));
  const availableCards = cards.filter((c) => !currentCardIds.has(c.id));

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* 카드 추가 폼 */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">팩에 카드 추가</h2>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">팩 선택</label>
          <select
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
            className={inputCls}
          >
            {packs.length === 0 && <option value="">팩을 먼저 등록하세요</option>}
            {packs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <form action={addAction} className="space-y-3">
          <input type="hidden" name="pack_id" value={selectedPackId} />
          <Field label="추가할 카드">
            <select name="card_id" required className={inputCls}>
              <option value="">카드 선택</option>
              {availableCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({RARITY_LABEL[c.rarity]})
                </option>
              ))}
            </select>
          </Field>
          <Field label="가중치 (높을수록 잘 나옴)">
            <input name="weight" type="number" min="0.01" step="0.01" defaultValue="10" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">예: 일반=100, 레어=20, UR=1, MUR=0.5</p>
          </Field>

          {addState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{addState.error}</p>}
          {addState?.success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">카드가 추가됐습니다!</p>}

          <button type="submit" disabled={addPending || !selectedPackId} className={submitCls}>
            {addPending ? "추가 중..." : "카드 추가"}
          </button>
        </form>
      </div>

      {/* 현재 팩 구성 */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">
          현재 팩 구성
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {packs.find((p) => p.id === selectedPackId)?.name ?? "팩을 선택하세요"} · {currentPackCards.length}종 카드
        </p>

        {removeState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{removeState.error}</p>}

        {currentPackCards.length === 0 ? (
          <Empty text="이 팩에 카드가 없어요" />
        ) : (
          <>
            {(() => {
              const totalWeight = currentPackCards.reduce((sum, pc) => sum + pc.weight, 0);
              return (
                <div className="space-y-2 max-h-[520px] overflow-y-auto">
                  {currentPackCards.map((pc) => {
                    const pct = totalWeight > 0 ? (pc.weight / totalWeight) * 100 : 0;
                    return (
                      <div key={pc.card_id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${pc.cards ? RARITY_COLOR[pc.cards.rarity] : "bg-gray-100 text-gray-500"}`}>
                            {pc.cards ? RARITY_LABEL[pc.cards.rarity] : "?"}
                          </span>
                          <p className="text-sm font-medium text-gray-900 truncate">{pc.cards?.name ?? pc.card_id}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-semibold text-violet-600">{pct.toFixed(2)}%</p>
                            <p className="text-xs text-gray-400">가중치 {pc.weight}</p>
                          </div>
                          <form action={removeAction}>
                            <input type="hidden" name="pack_id" value={pc.pack_id} />
                            <input type="hidden" name="card_id" value={pc.card_id} />
                            <button
                              type="submit"
                              disabled={removePending}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
                            >
                              삭제
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <p className="text-xs text-gray-400 mt-3 text-right">
              합계 가중치: {currentPackCards.reduce((s, pc) => s + pc.weight, 0).toFixed(2)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────── 공통 헬퍼 ─────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-gray-400">
      <div className="text-3xl mb-2">📭</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";

const submitCls =
  "w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors";

/* ─────────────── 도감 관리 탭 ─────────────── */
function DexTab({
  cards,
  dexSets,
  dexSetCards,
}: {
  cards: Card[];
  dexSets: DexSet[];
  dexSetCards: DexSetCard[];
}) {
  const [selectedSetId, setSelectedSetId] = useState(dexSets[0]?.id ?? "");
  const [createState, createAction, createPending] = useActionState(createDexSet, null);
  const [deleteSetState, deleteSetAction, deleteSetPending] = useActionState(deleteDexSet, null);
  const [addCardState, addCardAction, addCardPending] = useActionState(addCardToDexSet, null);
  const [removeCardState, removeCardAction, removeCardPending] = useActionState(removeCardFromDexSet, null);

  const currentSetCards = dexSetCards.filter((sc) => sc.set_id === selectedSetId);
  const currentCardIds = new Set(currentSetCards.map((sc) => sc.card_id));
  const availableCards = cards.filter((c) => !currentCardIds.has(c.id));

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* 왼쪽: 세트 생성 + 카드 추가 */}
      <div className="lg:col-span-2 space-y-4">
        {/* 세트 생성 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">도감 세트 생성</h2>
          <form action={createAction} className="space-y-3">
            <Field label="세트 이름 *">
              <input name="name" required placeholder="일진사과몽 세트" className={inputCls} />
            </Field>
            <Field label="설명">
              <textarea name="description" rows={2} placeholder="이 세트에 대한 설명" className={inputCls} />
            </Field>
            <Field label="보상 설명 (미래용)">
              <input name="reward_description" placeholder="완성 시 코인 500 지급" className={inputCls} />
            </Field>
            {createState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{createState.error}</p>}
            {createState?.success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">세트가 생성됐습니다!</p>}
            <button type="submit" disabled={createPending} className={submitCls}>
              {createPending ? "생성 중..." : "세트 생성"}
            </button>
          </form>
        </div>

        {/* 세트에 카드 추가 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">세트에 카드 추가</h2>
          {dexSets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">세트를 먼저 생성하세요</p>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">세트 선택</label>
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  className={inputCls}
                >
                  {dexSets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <form action={addCardAction} className="space-y-3">
                <input type="hidden" name="set_id" value={selectedSetId} />
                <Field label="추가할 카드">
                  <select name="card_id" required className={inputCls}>
                    <option value="">카드 선택</option>
                    {availableCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.rarity})
                      </option>
                    ))}
                  </select>
                </Field>
                {addCardState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{addCardState.error}</p>}
                {addCardState?.success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">카드가 추가됐습니다!</p>}
                <button type="submit" disabled={addCardPending || !selectedSetId} className={submitCls}>
                  {addCardPending ? "추가 중..." : "카드 추가"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* 오른쪽: 세트 목록 */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">도감 세트 목록 ({dexSets.length})</h2>
        {deleteSetState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{deleteSetState.error}</p>}
        {removeCardState?.error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{removeCardState.error}</p>}

        {dexSets.length === 0 ? (
          <Empty text="생성된 도감 세트가 없어요" />
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {dexSets.map((set) => {
              const setCards = dexSetCards.filter((sc) => sc.set_id === set.id);
              return (
                <div key={set.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{set.name}</p>
                      {set.description && <p className="text-xs text-gray-400 mt-0.5">{set.description}</p>}
                      {set.reward_description && (
                        <p className="text-xs text-amber-600 mt-0.5">보상: {set.reward_description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{setCards.length}종 카드</p>
                    </div>
                    <form action={deleteSetAction}>
                      <input type="hidden" name="set_id" value={set.id} />
                      <button
                        type="submit"
                        disabled={deleteSetPending}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        세트 삭제
                      </button>
                    </form>
                  </div>

                  {setCards.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-2">카드 없음</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {setCards.map((sc) => (
                        <div
                          key={sc.card_id}
                          className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"
                        >
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sc.cards ? RARITY_COLOR[sc.cards.rarity] : "bg-gray-100 text-gray-500"}`}>
                            {sc.cards?.rarity ?? "?"}
                          </span>
                          <span className="text-xs text-gray-700">{sc.cards?.name ?? sc.card_id}</span>
                          <form action={removeCardAction}>
                            <input type="hidden" name="set_id" value={set.id} />
                            <input type="hidden" name="card_id" value={sc.card_id} />
                            <button
                              type="submit"
                              disabled={removeCardPending}
                              className="text-gray-300 hover:text-red-400 transition-colors ml-0.5 text-xs leading-none"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── 이미지 업로드 ─────────────── */
function ImageUpload({ bucket, label = "이미지" }: { bucket: "cards" | "packs"; label?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError || !data) {
      setError(uploadError?.message ?? "업로드 실패");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    setUrl(publicUrl);
    setPreview(publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <input type="hidden" name="image_url" value={url} />
      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-400 transition-colors bg-gray-50 overflow-hidden">
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-contain p-1" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 select-none">
            <span className="text-2xl">🖼️</span>
            <span className="text-xs">{uploading ? "업로드 중..." : `${label} 선택 (클릭)`}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {preview && (
        <button
          type="button"
          onClick={() => { setPreview(null); setUrl(""); }}
          className="text-xs text-gray-400 hover:text-red-400 mt-1 transition-colors"
        >
          이미지 제거
        </button>
      )}
    </div>
  );
}
