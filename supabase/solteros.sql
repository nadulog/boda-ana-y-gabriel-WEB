-- Sección "Solteros" de la web de boda (Ana & Gabriel y futuras bodas).
-- Ejecutar una sola vez en Supabase > SQL Editor.

create table if not exists public.solteros (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_slug  text not null,
  nombre      text not null check (char_length(nombre) between 1 and 40),
  edad        int  not null check (edad between 18 and 99),
  genero      text not null check (genero in ('mujer', 'hombre', 'otro')),
  descripcion text not null check (char_length(descripcion) between 1 and 220),
  instagram   text not null check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  foto_url    text not null,
  visible     boolean not null default true   -- poner en false para ocultar un perfil
);

create index if not exists solteros_event_idx on public.solteros (event_slug, created_at desc);

alter table public.solteros enable row level security;

drop policy if exists "solteros: leer visibles" on public.solteros;
create policy "solteros: leer visibles" on public.solteros
  for select to anon using (visible);

drop policy if exists "solteros: publicar perfil" on public.solteros;
create policy "solteros: publicar perfil" on public.solteros
  for insert to anon with check (visible and foto_url like '%/storage/v1/object/public/solteros/%');

-- Bucket público para las fotos (máx. 3 MB, solo imágenes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('solteros', 'solteros', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "solteros: subir foto" on storage.objects;
create policy "solteros: subir foto" on storage.objects
  for insert to anon with check (bucket_id = 'solteros');
