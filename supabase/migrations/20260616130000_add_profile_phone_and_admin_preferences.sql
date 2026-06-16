-- ============================================================================
-- Migration : ajout de `phone` à `profiles` + table `admin_preferences`
--
-- À exécuter dans le SQL Editor de votre projet Supabase
-- (Dashboard → SQL Editor → New query → coller → Run).
-- Ce script est idempotent : il peut être rejoué sans danger.
--
-- Contexte :
--   1. La page "Mon Profil" admin permet d'éditer un numéro de téléphone
--      (colonne `phone` sur `profiles`).
--   2. La page "Mon Profil" admin permet de configurer langue, fuseau horaire,
--      notifications et statut en ligne via une nouvelle table 1:1
--      `admin_preferences` (1 ligne par utilisateur).
--
-- Sécurité :
--   * RLS activée : un utilisateur ne lit/écrit que SA PROPRE ligne.
--   * Aucune politique admin-only : on veut que les techniciens puissent aussi
--     configurer leurs préférences (cohérent avec la suite). Si tu veux
--     restreindre aux admins, change la condition `id = auth.uid()` en
--     `app_private.is_admin()` (et renomme la table en `admin_preferences`
--     déjà aligné avec ce rôle).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colonne `phone` sur `profiles`
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text;

-- ----------------------------------------------------------------------------
-- 2. Table `admin_preferences` (1 ligne par user)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_preferences (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  language     text not null default 'fr',
  timezone     text not null default 'Europe/Paris',
  notifications text[] not null default '{missions,conflicts,updates}',
  is_online    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Garde-fous de valeurs
  constraint admin_preferences_language_check
    check (language in ('fr', 'en')),
  constraint admin_preferences_timezone_check
    check (timezone in ('Europe/Paris', 'Europe/Brussels', 'Europe/London'))
);

-- Index utile si on liste "tous les admins en ligne" plus tard.
create index if not exists admin_preferences_is_online_idx
  on public.admin_preferences (is_online)
  where is_online = true;

-- ----------------------------------------------------------------------------
-- 3. Trigger `updated_at` automatique
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_preferences_set_updated_at on public.admin_preferences;
create trigger admin_preferences_set_updated_at
  before update on public.admin_preferences
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Backfill : créer une ligne de préférences par profil existant
--    (idempotent grâce à ON CONFLICT DO NOTHING)
-- ----------------------------------------------------------------------------
insert into public.admin_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 5. Grants
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.admin_preferences to authenticated;
revoke all on public.admin_preferences from anon;

-- ----------------------------------------------------------------------------
-- 6. RLS — chaque user ne lit/écrit que sa propre ligne
-- ----------------------------------------------------------------------------
alter table public.admin_preferences enable row level security;

drop policy if exists admin_preferences_select_own on public.admin_preferences;
create policy admin_preferences_select_own on public.admin_preferences
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists admin_preferences_insert_own on public.admin_preferences;
create policy admin_preferences_insert_own on public.admin_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists admin_preferences_update_own on public.admin_preferences;
create policy admin_preferences_update_own on public.admin_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists admin_preferences_delete_own on public.admin_preferences;
create policy admin_preferences_delete_own on public.admin_preferences
  for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 7. Realtime (ignoré si déjà ajouté)
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.admin_preferences;
exception when others then null;
end $$;
