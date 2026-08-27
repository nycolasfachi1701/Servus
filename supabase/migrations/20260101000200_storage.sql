-- =====================================================================
-- Servus — Migration 003: Storage (fotos de membros e imagens de eventos)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Leitura pública (as URLs são usadas em <img>); escrita só para liderança.
drop policy if exists "fotos_leitura_publica" on storage.objects;
create policy "fotos_leitura_publica" on storage.objects for select
  using (bucket_id = 'fotos');

drop policy if exists "fotos_upload_lideranca" on storage.objects;
create policy "fotos_upload_lideranca" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.eh_lideranca());

drop policy if exists "fotos_update_lideranca" on storage.objects;
create policy "fotos_update_lideranca" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.eh_lideranca())
  with check (bucket_id = 'fotos' and public.eh_lideranca());

drop policy if exists "fotos_delete_lideranca" on storage.objects;
create policy "fotos_delete_lideranca" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.eh_lideranca());
