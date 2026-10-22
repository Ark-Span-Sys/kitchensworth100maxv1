-- ============================================================================
-- 008_accounts.sql — KW accounts: reviews, refer-and-earn credits
-- Purely additive. Existing tables/rows are untouched; new columns are
-- nullable or defaulted so guest ordering and existing data keep working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: referral identity + credit wallet
-- ---------------------------------------------------------------------------
alter table profiles add column referral_code text unique;
alter table profiles add column referred_by uuid references profiles(id) on delete set null;
alter table profiles add column credit_balance_ngn int not null default 0;

-- ---------------------------------------------------------------------------
-- orders: optional account link + credit redemption snapshot
-- Both nullable/defaulted → no impact on existing rows or guest inserts.
-- ---------------------------------------------------------------------------
alter table orders add column user_id uuid references profiles(id) on delete set null;
alter table orders add column credit_applied_ngn int not null default 0;
create index orders_user_idx on orders (user_id) where user_id is not null;

-- ---------------------------------------------------------------------------
-- credit_transactions — signed ledger; balance derived via trigger
-- ---------------------------------------------------------------------------
create type credit_txn_kind as enum ('referral', 'admin', 'redemption');

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount_ngn int not null,  -- positive = earned, negative = spent
  kind credit_txn_kind not null default 'referral',
  reason text,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index credit_txn_user_idx on credit_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- referrals — one referrer→referee link, rewarded on referee's first paid order
-- ---------------------------------------------------------------------------
create type referral_status as enum ('pending', 'rewarded');

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referee_id uuid not null unique references profiles(id) on delete cascade,
  status referral_status not null default 'pending',
  rewarded_order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index referrals_referrer_idx on referrals (referrer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- reviews — one per user per item, gated by admin approval
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references menu_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);
create index reviews_item_idx on reviews (item_id, is_approved, created_at desc);

-- ---------------------------------------------------------------------------
-- Reward constants (single source of truth — tweak here).
-- ---------------------------------------------------------------------------
--   referee welcome credit : ₦1,000
--   referrer reward        : ₦1,500

-- ---------------------------------------------------------------------------
-- handle_new_profile_code — mint a unique referral_code for every profile
-- ---------------------------------------------------------------------------
create or replace function handle_new_profile_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if new.referral_code is null then
    loop
      code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      begin
        update profiles set referral_code = code where id = new.id;
        exit;
      exception
        when unique_violation then continue;
      end;
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_profile_created_code
  after insert on profiles
  for each row execute function handle_new_profile_code();

-- Backfill codes for any profiles that already exist.
update profiles p set referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where p.referral_code is null;

-- ---------------------------------------------------------------------------
-- bump_credit_balance — keep profiles.credit_balance_ngn in sync with ledger
-- ---------------------------------------------------------------------------
create or replace function bump_credit_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set credit_balance_ngn = credit_balance_ngn + new.amount_ngn
   where id = new.user_id;
  return new;
end;
$$;

create trigger on_credit_txn_bump
  after insert on credit_transactions
  for each row execute function bump_credit_balance();

-- ---------------------------------------------------------------------------
-- award_referral_on_first_paid — fire when a referred user's FIRST order
-- transitions into paid/confirmed. Trigger-based so it works regardless of
-- whether payment came from the Monnify webhook or an admin status change.
-- ---------------------------------------------------------------------------
create or replace function award_referral_on_first_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referee  uuid;
  v_referrer uuid;
  v_ref_id   uuid;
begin
  if new.status in ('paid', 'confirmed') and old.status not in ('paid', 'confirmed') then
    v_referee := new.user_id;
    if v_referee is null then
      return new;
    end if;

    select referred_by into v_referrer from profiles where id = v_referee;
    if v_referrer is null then
      return new;
    end if;

    -- Only on the FIRST paid order (no other paid/confirmed order yet).
    if exists (
      select 1 from orders
      where user_id = v_referee
        and status in ('paid', 'confirmed')
        and id <> new.id
    ) then
      return new;
    end if;

    select id into v_ref_id from referrals
      where referee_id = v_referee and status = 'pending';
    if v_ref_id is null then
      return new;
    end if;

    insert into credit_transactions (user_id, amount_ngn, kind, reason, order_id)
    values (v_referee, 1000, 'referral', 'Welcome credit on your first order', new.id);

    insert into credit_transactions (user_id, amount_ngn, kind, reason, order_id)
    values (v_referrer, 1500, 'referral', 'Referral reward: a friend placed their first order', new.id);

    update referrals
       set status = 'rewarded', rewarded_order_id = new.id
     where id = v_ref_id;
  end if;
  return new;
end;
$$;

create trigger on_order_paid_award_referral
  after update of status on orders
  for each row execute function award_referral_on_first_paid();

-- ---------------------------------------------------------------------------
-- RLS (additive)
-- ---------------------------------------------------------------------------
alter table credit_transactions enable row level security;
alter table referrals           enable row level security;
alter table reviews             enable row level security;

-- credit_transactions: read own, admin manages (ledger is written by definer
-- triggers and trusted server code only).
create policy "credit_txn: read own or admin" on credit_transactions
  for select using (user_id = auth.uid() or is_admin());
create policy "credit_txn: admin all" on credit_transactions
  for all using (is_admin()) with check (is_admin());

-- referrals: read rows I'm part of, self-insert my own incoming link, admin all.
create policy "referrals: read own or admin" on referrals
  for select using (referrer_id = auth.uid() or referee_id = auth.uid() or is_admin());
create policy "referrals: auth insert own" on referrals
  for insert with check (referee_id = auth.uid());
create policy "referrals: admin all" on referrals
  for all using (is_admin()) with check (is_admin());

-- reviews: public reads approved, author reads/creates/edits own, admin all.
create policy "reviews: public read approved" on reviews
  for select using (is_approved = true or user_id = auth.uid() or is_admin());
create policy "reviews: auth insert own" on reviews
  for insert with check (user_id = auth.uid());
create policy "reviews: update own" on reviews
  for update using (user_id = auth.uid());
create policy "reviews: admin all" on reviews
  for all using (is_admin()) with check (is_admin());

-- orders: authenticated guests keep working via the existing public-insert
-- policy; add a companion policy so signed-in users can insert their own
-- orders (including fully-credit-paid ones), plus read their own history.
create policy "orders: authenticated insert" on orders
  for insert with check (
    status in ('pending', 'awaiting_payment', 'paid')
    and user_id = auth.uid()
  );
create policy "orders: read own" on orders
  for select using (user_id = auth.uid());
