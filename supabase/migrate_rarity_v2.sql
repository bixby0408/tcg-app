-- 레어도 시스템 변경: N / R / RR / AR / SR / SAR / UR / MUR
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 CHECK 제약 제거
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_rarity_check;

-- 2. 기존 데이터 마이그레이션 (구 → 신)
UPDATE public.cards SET rarity = 'N'   WHERE rarity IN ('common', 'uncommon');
UPDATE public.cards SET rarity = 'R'   WHERE rarity = 'rare';
UPDATE public.cards SET rarity = 'RR'  WHERE rarity = 'double_rare';
UPDATE public.cards SET rarity = 'AR'  WHERE rarity = 'art_rare';
UPDATE public.cards SET rarity = 'SAR' WHERE rarity = 'special_art_rare';
UPDATE public.cards SET rarity = 'UR'  WHERE rarity IN ('hyper_rare', 'ultra_rare');

-- 3. 새 CHECK 제약 추가
ALTER TABLE public.cards
  ADD CONSTRAINT cards_rarity_check
  CHECK (rarity IN ('N', 'R', 'RR', 'AR', 'SR', 'SAR', 'UR', 'MUR'));
