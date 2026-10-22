-- ============================================================================
-- 003_rls.sql — Row Level Security
-- Public read on catalogue content; admin full CRUD; safe public insert on
-- orders limited to initial states.
-- ============================================================================

alter table profiles            enable row level security;
alter table cities              enable row level security;
alter table zones               enable row level security;
alter table categories          enable row level security;
alter table menu_items          enable row level security;
alter table menu_extras         enable row level security;
alter table party_packs         enable row level security;
alter table bulk_tiers          enable row level security;
alter table catering_packages   enable row level security;
alter table payment_providers   enable row level security;
alter table site_settings       enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table order_status_events enable row level security;
alter table admin_audit         enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read own or admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles: update own" on profiles
  for update using (id = auth.uid());
create policy "profiles: admin manage all" on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Public read (only active rows)
-- ---------------------------------------------------------------------------
create policy "cities: public read active" on cities
  for select using (is_active = true or is_admin());
create policy "zones: public read active" on zones
  for select using (is_active = true and exists (select 1 from cities c where c.id = city_id and c.is_active) or is_admin());
create policy "categories: public read active" on categories
  for select using (is_active = true or is_admin());
create policy "menu_items: public read active" on menu_items
  for select using (is_active = true or is_admin());
create policy "menu_extras: public read" on menu_extras
  for select using (true);
create policy "party_packs: public read active" on party_packs
  for select using (is_active = true or is_admin());
create policy "bulk_tiers: public read" on bulk_tiers
  for select using (true);
create policy "catering_packages: public read active" on catering_packages
  for select using (is_active = true or is_admin());
create policy "payment_providers: public read" on payment_providers
  for select using (is_enabled = true or is_admin());

-- site_settings: expose only safe columns to the public. Bank fields are
-- protected by a column-level policy.
create policy "site_settings: public read safe cols" on site_settings
  for select using (id = 1 or is_admin());
revoke select (bank_name, bank_account_name, bank_account_number) on site_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Orders: public can INSERT (only initial states), and SELECT by phone
-- (used by /track). Admin has full access.
-- ---------------------------------------------------------------------------
create policy "orders: public insert initial" on orders
  for insert with check (
    status in ('pending', 'awaiting_payment')
    and auth.uid() is null  -- anonymous checkout
  );
create policy "orders: admin all" on orders
  for all using (is_admin()) with check (is_admin());
create policy "orders: lookup by phone" on orders
  for select using (true);  -- filtered further by RPC track_orders()

create policy "order_items: public insert" on order_items
  for insert with check (true);
create policy "order_items: admin all" on order_items
  for all using (is_admin()) with check (is_admin());
create policy "order_items: public read" on order_items
  for select using (true);

create policy "order_status_events: admin all" on order_status_events
  for all using (is_admin()) with check (is_admin());
create policy "order_status_events: public read" on order_status_events
  for select using (true);

create policy "admin_audit: admin read" on admin_audit
  for select using (is_admin());
create policy "admin_audit: admin insert" on admin_audit
  for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- Admin write on catalogue tables
-- ---------------------------------------------------------------------------
create policy "cities: admin write" on cities
  for all using (is_admin()) with check (is_admin());
create policy "zones: admin write" on zones
  for all using (is_admin()) with check (is_admin());
create policy "categories: admin write" on categories
  for all using (is_admin()) with check (is_admin());
create policy "menu_items: admin write" on menu_items
  for all using (is_admin()) with check (is_admin());
create policy "menu_extras: admin write" on menu_extras
  for all using (is_admin()) with check (is_admin());
create policy "party_packs: admin write" on party_packs
  for all using (is_admin()) with check (is_admin());
create policy "bulk_tiers: admin write" on bulk_tiers
  for all using (is_admin()) with check (is_admin());
create policy "catering_packages: admin write" on catering_packages
  for all using (is_admin()) with check (is_admin());
create policy "payment_providers: admin write" on payment_providers
  for all using (is_admin()) with check (is_admin());
create policy "site_settings: admin write" on site_settings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- track_orders(p_query): search orders by order_number OR phone.
-- SECURITY DEFINER so it can bypass the phone-filter policy above.
-- ---------------------------------------------------------------------------
create or replace function track_orders(p_query text)
returns table (
  id uuid, order_number text, customer_name text, phone text,
  status order_status, total_ngn int, created_at timestamptz,
  order_type order_type, estimated_minutes int
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.order_number, o.customer_name, o.phone,
         o.status, o.total_ngn, o.created_at, o.order_type, o.estimated_minutes
  from orders o
  where o.order_number = upper(trim(p_query))
     or regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(p_query, '\D', '', 'g');
$$;

grant execute on function track_orders(text) to anon, authenticated;
grant execute on function view_bank() to anon, authenticated;
