-- ============================================================================
-- 004_storage.sql — Supabase Storage buckets for menu images
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- Public read on both buckets.
create policy "menu-images: public read" on storage.objects
  for select using (bucket_id in ('menu-images', 'site-assets'));

-- Admin-only write.
create policy "menu-images: admin write" on storage.objects
  for all using (
    bucket_id in ('menu-images', 'site-assets') and is_admin()
  ) with check (
    bucket_id in ('menu-images', 'site-assets') and is_admin()
  );
