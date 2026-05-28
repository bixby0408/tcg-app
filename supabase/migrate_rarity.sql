-- ============================================================
-- 희귀도 체계를 포켓몬 TCG (스칼렛&바이올렛) 기준으로 변경
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 기존 CHECK 제약 삭제 후 새 제약 추가
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_rarity_check;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'double_rare', 'art_rare', 'special_art_rare', 'hyper_rare'));

-- 기존 테스트 데이터 희귀도 업데이트
UPDATE public.cards SET rarity = 'double_rare'     WHERE rarity = 'ultra_rare';
UPDATE public.cards SET rarity = 'special_art_rare' WHERE rarity = 'secret_rare';
