-- ============================================================
-- 1. profiles 테이블
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade not null primary key,
  nickname    text unique,
  avatar_url  text,
  balance     numeric not null default 0,        -- 보유 코인 (SOOP 시청 포인트 연동 예정)
  is_admin    boolean not null default false,     -- 관리자 여부
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  updated_at  timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- 2. Row Level Security - profiles
-- ============================================================
alter table public.profiles enable row level security;

create policy "누구나 프로필 조회 가능" on public.profiles
  for select using (true);

create policy "본인 프로필만 삽입 가능" on public.profiles
  for insert with check (auth.uid() = id);

create policy "본인 프로필만 수정 가능" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- 3. updated_at 자동 갱신 함수
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 4. 회원가입 시 프로필 자동 생성 트리거
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 5. 아바타용 Storage 버킷
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "아바타 공개 읽기" on storage.objects;
drop policy if exists "본인 아바타만 업로드" on storage.objects;
drop policy if exists "본인 아바타만 수정" on storage.objects;
drop policy if exists "본인 아바타만 삭제" on storage.objects;

create policy "아바타 공개 읽기" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "본인 아바타만 업로드" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "본인 아바타만 수정" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "본인 아바타만 삭제" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 6. 관리자 확인 헬퍼 함수
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- ============================================================
-- 7. cards 테이블 (관리자가 등록하는 카드 마스터)
-- ============================================================
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  image_url     text,
  rarity        text not null check (rarity in ('common', 'uncommon', 'rare', 'ultra_rare', 'secret_rare')),
  card_type     text,                              -- 타입 (예: fire, water, grass ...)
  card_number   text,                              -- 카드 번호 (예: 001/150)
  series        text,                              -- 시리즈명 (예: 1기 베이스)
  current_price numeric not null default 0,        -- 현재 시세
  total_supply  integer not null default 0,        -- 현재까지 발행된 총 수량
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.cards enable row level security;

-- 누구나 조회 가능, 관리자만 CUD
create policy "카드 공개 조회" on public.cards
  for select using (true);

create policy "관리자만 카드 등록" on public.cards
  for insert with check (public.is_admin());

create policy "관리자만 카드 수정" on public.cards
  for update using (public.is_admin());

create policy "관리자만 카드 삭제" on public.cards
  for delete using (public.is_admin());

create trigger cards_updated_at
  before update on public.cards
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 8. packs 테이블 (팩 종류)
-- ============================================================
create table if not exists public.packs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  image_url      text,
  price          numeric not null check (price > 0),   -- 팩 구매 가격 (코인)
  cards_per_pack integer not null default 5,           -- 팩당 카드 수
  is_active      boolean not null default true,        -- 판매 활성화 여부
  release_date   date,
  created_at     timestamptz default now() not null
);

alter table public.packs enable row level security;

create policy "팩 공개 조회" on public.packs
  for select using (true);

create policy "관리자만 팩 등록" on public.packs
  for insert with check (public.is_admin());

create policy "관리자만 팩 수정" on public.packs
  for update using (public.is_admin());

create policy "관리자만 팩 삭제" on public.packs
  for delete using (public.is_admin());

-- ============================================================
-- 9. pack_cards 테이블 (팩 구성 + 뽑기 가중치)
-- ============================================================
create table if not exists public.pack_cards (
  pack_id uuid references public.packs(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  weight  integer not null default 1 check (weight > 0), -- 높을수록 더 잘 나옴
  primary key (pack_id, card_id)
);

alter table public.pack_cards enable row level security;

create policy "팩 구성 공개 조회" on public.pack_cards
  for select using (true);

create policy "관리자만 팩 구성 등록" on public.pack_cards
  for insert with check (public.is_admin());

create policy "관리자만 팩 구성 수정" on public.pack_cards
  for update using (public.is_admin());

create policy "관리자만 팩 구성 삭제" on public.pack_cards
  for delete using (public.is_admin());

-- ============================================================
-- 10. user_cards 테이블 (유저 인벤토리)
-- ============================================================
create table if not exists public.user_cards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  card_id      uuid references public.cards(id) on delete cascade not null,
  acquired_via text not null check (acquired_via in ('pack', 'purchase')), -- 획득 경로
  is_listed    boolean not null default false,  -- 마켓에 등록 중 여부
  acquired_at  timestamptz default now() not null
);

alter table public.user_cards enable row level security;

-- 본인 카드만 조회 (마켓 목록은 listings 통해 공개)
create policy "본인 카드 조회" on public.user_cards
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE는 서버 함수(security definer)가 처리
create policy "시스템 카드 지급" on public.user_cards
  for insert with check (auth.uid() = user_id);

create policy "본인 카드 상태 수정" on public.user_cards
  for update using (auth.uid() = user_id);

-- ============================================================
-- 11. market_listings 테이블 (마켓 판매 목록)
-- ============================================================
create table if not exists public.market_listings (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid references auth.users(id) on delete cascade not null,
  user_card_id uuid references public.user_cards(id) on delete cascade not null,
  price        numeric not null check (price > 0),
  status       text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at   timestamptz default now() not null,
  sold_at      timestamptz
);

alter table public.market_listings enable row level security;

-- 활성 목록은 누구나 조회, 자신의 목록은 전체 조회
create policy "활성 마켓 목록 공개 조회" on public.market_listings
  for select using (status = 'active' or auth.uid() = seller_id);

create policy "본인만 마켓 등록" on public.market_listings
  for insert with check (auth.uid() = seller_id);

create policy "본인만 마켓 수정·취소" on public.market_listings
  for update using (auth.uid() = seller_id);

-- ============================================================
-- 12. card_price_history 테이블 (가격 변동 이력)
-- ============================================================
create table if not exists public.card_price_history (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid references public.cards(id) on delete cascade not null,
  price       numeric not null,
  recorded_at timestamptz default now() not null
);

alter table public.card_price_history enable row level security;

create policy "가격 이력 공개 조회" on public.card_price_history
  for select using (true);

-- INSERT는 서버 함수가 처리 (거래 발생 시 자동 기록)

-- ============================================================
-- 13. pack_purchases 테이블 (뽑기 기록)
-- ============================================================
create table if not exists public.pack_purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  pack_id      uuid references public.packs(id) on delete cascade not null,
  cost         numeric not null,
  purchased_at timestamptz default now() not null
);

alter table public.pack_purchases enable row level security;

create policy "본인 뽑기 기록 조회" on public.pack_purchases
  for select using (auth.uid() = user_id);

create policy "본인 뽑기 기록 등록" on public.pack_purchases
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- 14. 성능 인덱스
-- ============================================================
create index if not exists idx_user_cards_user_id on public.user_cards(user_id);
create index if not exists idx_user_cards_card_id on public.user_cards(card_id);
create index if not exists idx_market_listings_status on public.market_listings(status);
create index if not exists idx_market_listings_seller on public.market_listings(seller_id);
create index if not exists idx_card_price_history_card on public.card_price_history(card_id, recorded_at desc);
create index if not exists idx_pack_purchases_user on public.pack_purchases(user_id);
