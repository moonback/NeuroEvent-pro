-- ============================================================================
-- Migration : bucket `avatars` + colonne `avatar_url` sur `profiles`
--
-- À exécuter dans le SQL Editor de votre projet Supabase
-- (Dashboard → SQL Editor → New query → coller → Run).
-- Ce script est idempotent : il peut être rejoué sans danger.
--
-- Contexte :
--   La page "Mon Profil" permet d'uploader une vraie photo d'avatar à la
--   place des initiales. L'image est compressée côté client (canvas → WebP
--   ~512px) puis uploadée dans le bucket `avatars`, organisée par user_id.
--
-- Sécurité Storage (chemin : `{user_id}/avatar-{timestamp}.webp`) :
--   * SELECT (lecture publique) : n'importe qui, le bucket est public pour
--     permettre l'affichage des avatars dans toute l'UI (liste utilisateurs,
--     drawer de mission, etc.) sans RLS compliqué.
--   * INSERT / UPDATE / DELETE : un user ne peut écrire que dans son propre
--     dossier (chemin commence par `auth.uid() || '/'`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colonne `avatar_url` sur `profiles`
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

-- ----------------------------------------------------------------------------
-- 2. Bucket `avatars` (public read, privé en écriture)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Storage RLS — chaque user écrit UNIQUEMENT dans son dossier personnel
--    (`{user_id}/...`). Le préfixe du chemin doit correspondre à auth.uid().
-- ----------------------------------------------------------------------------

-- SELECT public : tout le monde peut lire les avatars
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- INSERT : un user ne peut créer qu'un objet dont le path commence par son id
drop policy if exists "avatars_user_insert" on storage.objects;
create policy "avatars_user_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE : idem (un user ne peut remplacer que ses propres fichiers)
drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE : idem
drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
