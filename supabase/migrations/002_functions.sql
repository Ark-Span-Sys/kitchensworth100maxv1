-- ============================================================================
-- 002_functions.sql — helper functions used by RLS and app code
-- ============================================================================

-- is_admin(): true if the current JWT belongs to a profile with is_admin = true.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- view_bank(): returns bank details ONLY when manual_bank is enabled.
-- Exposed via RPC so RLS on site_settings can safely hide the raw columns.
create or replace function view_bank()
returns table (bank_name text, bank_account_name text, bank_account_number text)
language sql
stable
security definer
set search_path = public
as $$
  select s.bank_name, s.bank_account_name, s.bank_account_number
  from site_settings s
  join payment_providers p on p.key = 'manual_bank'
  where s.id = 1 and p.is_enabled = true;
$$;

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, phone, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    -- Bootstrap: the first user to sign up becomes admin. Subsequent
    -- signups default to false.
    (select count(*) = 0 from profiles)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
