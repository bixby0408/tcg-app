-- ============================================================
-- 도감 시스템 마이그레이션
-- Supabase 대시보드 SQL 에디터에서 실행하세요
-- ============================================================

-- 1. 도감 세트 정의 (관리자가 생성)
create table if not exists public.dex_sets (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  reward_description text,
  created_at         timestamptz default now()
);

-- 2. 세트에 포함되는 카드 매핑
create table if not exists public.dex_set_cards (
  set_id  uuid references public.dex_sets(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  primary key (set_id, card_id)
);

-- 3. 유저 등록 기록
create table if not exists public.dex_registrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  set_id        uuid references public.dex_sets(id) on delete cascade,
  card_id       uuid references public.cards(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(user_id, set_id, card_id)
);

-- RLS 활성화
alter table public.dex_sets          enable row level security;
alter table public.dex_set_cards     enable row level security;
alter table public.dex_registrations enable row level security;

-- dex_sets 정책
create policy "누구나 도감 세트 조회 가능" on public.dex_sets
  for select using (true);
create policy "관리자만 도감 세트 생성" on public.dex_sets
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "관리자만 도감 세트 삭제" on public.dex_sets
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- dex_set_cards 정책
create policy "누구나 도감 세트 카드 조회 가능" on public.dex_set_cards
  for select using (true);
create policy "관리자만 도감 세트 카드 추가" on public.dex_set_cards
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "관리자만 도감 세트 카드 삭제" on public.dex_set_cards
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- dex_registrations 정책
create policy "본인 도감 등록만 조회 가능" on public.dex_registrations
  for select using (auth.uid() = user_id);
create policy "본인 도감만 등록 가능" on public.dex_registrations
  for insert with check (auth.uid() = user_id);
create policy "본인 도감 등록만 취소 가능" on public.dex_registrations
  for delete using (auth.uid() = user_id);
