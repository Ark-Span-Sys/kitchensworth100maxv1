-- ============================================================================
-- 001_init.sql — Kitchen's Worth schema
-- Extensions, enums, tables, indexes.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type order_type as enum ('pickup', 'delivery');

create type order_status as enum (
  'pending',
  'awaiting_payment',
  'paid',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled'
);

create type payment_provider_key as enum (
  'monnify_card',
  'monnify_transfer',
  'manual_bank'
);

create type order_item_kind as enum ('menu_item', 'party_pack');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users entry, holds admin flag
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- cities — multi-city architecture. Abuja active by default.
-- ---------------------------------------------------------------------------
create table cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state text not null,
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index cities_active_idx on cities (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- zones — city-scoped delivery areas
-- ---------------------------------------------------------------------------
create table zones (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  name text not null,
  area_label text not null,
  eta_minutes int not null,
  fee_ngn int not null check (fee_ngn >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, name)
);
create index zones_city_active_idx on zones (city_id, is_active);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index categories_active_idx on categories (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  slug text unique not null,
  name text not null,
  description text,
  ingredients text[] not null default '{}',
  price_ngn int not null check (price_ngn >= 0),
  image_url text,
  is_best_seller boolean not null default false,
  is_signature boolean not null default false,
  is_spicy boolean not null default false,
  is_vegan boolean not null default false,
  stock_today int,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index menu_items_cat_idx on menu_items (category_id, is_active, sort_order);
create index menu_items_bestseller_idx on menu_items (is_best_seller) where is_active;
create index menu_items_search_idx on menu_items using gin (to_tsvector('simple', name || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- menu_extras — per-item add-ons ("+ extras" pattern from Rahmies)
-- ---------------------------------------------------------------------------
create table menu_extras (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references menu_items(id) on delete cascade,
  name text not null,
  price_ngn int not null check (price_ngn >= 0),
  is_required boolean not null default false,
  sort_order int not null default 0
);
create index menu_extras_item_idx on menu_extras (item_id, sort_order);

-- ---------------------------------------------------------------------------
-- party_packs
-- ---------------------------------------------------------------------------
create table party_packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  serves_min int not null,
  serves_max int not null,
  price_ngn int not null check (price_ngn >= 0),
  contents text[] not null default '{}',
  image_url text,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (serves_max >= serves_min)
);
create index party_packs_active_idx on party_packs (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- bulk_tiers — per-line auto discount
-- ---------------------------------------------------------------------------
create table bulk_tiers (
  id uuid primary key default gen_random_uuid(),
  min_qty int not null unique check (min_qty >= 2),
  discount_percent numeric(5,2) not null check (discount_percent between 0 and 100),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- catering_packages
-- ---------------------------------------------------------------------------
create table catering_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null,
  price_ngn int not null check (price_ngn >= 0),
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- payment_providers — admin toggles
-- ---------------------------------------------------------------------------
create table payment_providers (
  key payment_provider_key primary key,
  label text not null,
  description text,
  is_enabled boolean not null default false,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- site_settings — single row (id = 1)
-- ---------------------------------------------------------------------------
create table site_settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  opening_hours jsonb not null default '{}'::jsonb,
  ticker_messages text[] not null default '{}',
  tagline text not null default '...eat well & spend less.',
  vat_percent numeric(4,2) not null default 7.5,
  dock_enabled boolean not null default true,
  dock_config jsonb not null default '["menu","party-packs","cart","track","whatsapp"]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  email text,
  order_type order_type not null,
  zone_id uuid references zones(id) on delete set null,
  address text,
  status order_status not null default 'pending',
  subtotal_ngn int not null check (subtotal_ngn >= 0),
  delivery_fee_ngn int not null default 0 check (delivery_fee_ngn >= 0),
  discount_ngn int not null default 0 check (discount_ngn >= 0),
  total_ngn int not null check (total_ngn >= 0),
  payment_provider payment_provider_key not null,
  monnify_reference text,
  estimated_minutes int,
  notes text,
  whatsapp_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on orders (status, created_at desc);
create index orders_phone_idx on orders (phone);
create index orders_number_idx on orders (order_number);
create index orders_monnify_ref_idx on orders (monnify_reference) where monnify_reference is not null;

-- ---------------------------------------------------------------------------
-- order_items — snapshot of what was ordered (survives menu edits)
-- ---------------------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  kind order_item_kind not null,
  ref_id uuid not null,
  item_name_snapshot text not null,
  unit_price_snapshot int not null check (unit_price_snapshot >= 0),
  quantity int not null check (quantity > 0),
  line_total int not null check (line_total >= 0),
  extras jsonb not null default '[]'::jsonb
);
create index order_items_order_idx on order_items (order_id);

-- ---------------------------------------------------------------------------
-- order_status_events — audit trail
-- ---------------------------------------------------------------------------
create table order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_events_order_idx on order_status_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- admin_audit — every admin mutation
-- ---------------------------------------------------------------------------
create table admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_actor_idx on admin_audit (actor, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger site_settings_updated_at before update on site_settings
  for each row execute function set_updated_at();
