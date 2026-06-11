-- ============================================================================
-- NeuroEventPlanning — Migration complète issue de l'audit du 10/06/2026
--
-- À exécuter dans le SQL Editor de votre projet Supabase
-- (Dashboard → SQL Editor → New query → coller → Run).
-- Ce script est idempotent : il peut être rejoué sans danger.
--
-- Contenu :
--   1. Table `profiles` : source de vérité des rôles (Admin / Technicien)
--   2. Trigger de création automatique du profil à l'inscription
--      (le rôle est TOUJOURS forcé à 'Technicien' — jamais lu depuis les
--       métadonnées client, qui sont modifiables par l'utilisateur)
--   3. Protection anti auto-promotion de rôle
--   4. Table `clients`
--   5. Colonnes `missions.client_id` et `mission_equipments.checked`
--   6. RLS sur TOUTES les tables métier
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Schéma privé : les fonctions security definer n'y sont pas exposées
--    par l'API REST (recommandation Supabase).
-- ----------------------------------------------------------------------------
create schema if not exists app_private;
grant usage on schema app_private to authenticated;

-- ----------------------------------------------------------------------------
-- 1. Table PROFILES
--    `create table if not exists` ne modifie PAS une table déjà existante :
--    les `alter table ... add column if not exists` ci-dessous mettent à
--    niveau une table `profiles` créée par une ancienne version de l'app.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';
alter table public.profiles add column if not exists role text not null default 'Technicien';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- Anciennes politiques RLS sur profiles : on les retire toutes (elles seraient
-- bloquantes pour le changement de type ci-dessous, et les nôtres sont
-- recréées plus bas dans ce script).
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

-- Si `role` est un type enum hérité (ex: user_role), conversion en text.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'role' and data_type = 'USER-DEFINED'
  ) then
    alter table public.profiles alter column role drop default;
    alter table public.profiles alter column role type text using role::text;
  end if;
end $$;

alter table public.profiles alter column role set default 'Technicien';

-- Normalisation des rôles existants avant pose de la contrainte.
update public.profiles set role = 'Admin' where lower(role) = 'admin' and role <> 'Admin';
update public.profiles set role = 'Technicien' where role not in ('Admin', 'Technicien');

-- Contrainte de rôle (ignorée si déjà posée).
do $$
begin
  alter table public.profiles
    add constraint profiles_role_check check (role in ('Admin', 'Technicien'));
exception when others then null;
end $$;

grant select, insert, update, delete on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- ----------------------------------------------------------------------------
-- 2. Fonction is_admin() — security definer pour éviter la récursion RLS,
--    placée dans le schéma privé, search_path figé.
-- ----------------------------------------------------------------------------
create or replace function app_private.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  );
$$;
grant execute on function app_private.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Création automatique du profil (et de la fiche technicien) à l'inscription.
--    Le rôle est forcé à 'Technicien' : la promotion Admin se fait uniquement
--    par un administrateur existant (page Utilisateurs) ou via SQL.
-- ----------------------------------------------------------------------------
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    'Technicien'
  )
  on conflict (id) do nothing;

  insert into public.technicians (id, first_name, last_name, specialty, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    'Général',
    '#3b82f6'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Backfill des utilisateurs existants (one-shot).
--    Exception assumée : on honore le rôle des métadonnées pour conserver
--    vos comptes Admin actuels. Les NOUVELLES inscriptions, elles, sont
--    toujours créées 'Technicien' par le trigger ci-dessus.
-- ----------------------------------------------------------------------------
insert into public.profiles (id, email, first_name, last_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'first_name', ''),
  coalesce(u.raw_user_meta_data->>'last_name', ''),
  case when u.raw_user_meta_data->>'role' = 'Admin' then 'Admin' else 'Technicien' end
from auth.users u
on conflict (id) do nothing;

-- Complète l'email des profils créés avant cette migration (colonne absente).
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

-- Aligne le rôle des profils préexistants sur les métadonnées d'inscription
-- (one-shot : conserve vos comptes Admin créés avant cette migration).
update public.profiles p
set role = 'Admin'
from auth.users u
where u.id = p.id
  and p.role = 'Technicien'
  and u.raw_user_meta_data->>'role' = 'Admin';

-- ----------------------------------------------------------------------------
-- 5. Anti auto-promotion : seul un admin peut changer un rôle.
-- ----------------------------------------------------------------------------
create or replace function app_private.protect_role_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not app_private.is_admin() then
    raise exception 'Seul un administrateur peut modifier les rôles.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function app_private.protect_role_change();

-- ----------------------------------------------------------------------------
-- 6. Table CLIENTS
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.clients to authenticated;
revoke all on public.clients from anon;

-- Publication realtime (ignorée si déjà présente)
do $$
begin
  alter publication supabase_realtime add table public.clients;
exception when others then null;
end $$;

-- ----------------------------------------------------------------------------
-- 7. Évolutions de schéma
-- ----------------------------------------------------------------------------
alter table public.missions
  add column if not exists client_id uuid references public.clients(id) on delete set null;

alter table public.mission_equipments
  add column if not exists checked boolean not null default false;

-- ----------------------------------------------------------------------------
-- 8. RLS — activation sur toutes les tables métier
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.clients             enable row level security;
alter table public.missions            enable row level security;
alter table public.technicians         enable row level security;
alter table public.trucks              enable row level security;
alter table public.equipments          enable row level security;
alter table public.mission_technicians enable row level security;
alter table public.mission_equipments  enable row level security;

-- ---- PROFILES : lecture soi-même ou admin ; écriture encadrée -------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or app_private.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or app_private.is_admin())
  with check (id = auth.uid() or app_private.is_admin());
  -- Le changement de rôle reste bloqué par le trigger profiles_protect_role.

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (app_private.is_admin());

-- ---- CLIENTS : lecture pour tous les connectés, écriture admin ------------
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select to authenticated using (true);

drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients
  for all to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

-- ---- TECHNICIANS : lecture tous ; écriture admin ; un technicien peut -----
-- ---- mettre à jour sa propre fiche (synchro nom depuis Paramètres) --------
drop policy if exists technicians_select on public.technicians;
create policy technicians_select on public.technicians
  for select to authenticated using (true);

drop policy if exists technicians_insert_admin on public.technicians;
create policy technicians_insert_admin on public.technicians
  for insert to authenticated
  with check (app_private.is_admin() or id = auth.uid());

drop policy if exists technicians_update on public.technicians;
create policy technicians_update on public.technicians
  for update to authenticated
  using (app_private.is_admin() or id = auth.uid())
  with check (app_private.is_admin() or id = auth.uid());

drop policy if exists technicians_delete_admin on public.technicians;
create policy technicians_delete_admin on public.technicians
  for delete to authenticated
  using (app_private.is_admin());

-- ---- TRUCKS / EQUIPMENTS : lecture tous, écriture admin -------------------
drop policy if exists trucks_select on public.trucks;
create policy trucks_select on public.trucks
  for select to authenticated using (true);

drop policy if exists trucks_write on public.trucks;
create policy trucks_write on public.trucks
  for all to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists equipments_select on public.equipments;
create policy equipments_select on public.equipments
  for select to authenticated using (true);

drop policy if exists equipments_write on public.equipments;
create policy equipments_write on public.equipments
  for all to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

-- ---- MISSIONS : lecture tous ; création/suppression admin ; ---------------
-- ---- mise à jour par l'admin OU un technicien affecté (changement statut) -
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions
  for select to authenticated using (true);

drop policy if exists missions_insert_admin on public.missions;
create policy missions_insert_admin on public.missions
  for insert to authenticated
  with check (app_private.is_admin());

drop policy if exists missions_update on public.missions;
create policy missions_update on public.missions
  for update to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = id and mt.technician_id = auth.uid()
    )
  )
  with check (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = id and mt.technician_id = auth.uid()
    )
  );

drop policy if exists missions_delete_admin on public.missions;
create policy missions_delete_admin on public.missions
  for delete to authenticated
  using (app_private.is_admin());

-- ---- MISSION_TECHNICIANS : lecture tous, écriture admin -------------------
drop policy if exists mission_technicians_select on public.mission_technicians;
create policy mission_technicians_select on public.mission_technicians
  for select to authenticated using (true);

drop policy if exists mission_technicians_write on public.mission_technicians;
create policy mission_technicians_write on public.mission_technicians
  for all to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

-- ---- MISSION_EQUIPMENTS : lecture tous ; insert/delete admin ; ------------
-- ---- update (pointage `checked`) par l'admin OU un technicien affecté -----
drop policy if exists mission_equipments_select on public.mission_equipments;
create policy mission_equipments_select on public.mission_equipments
  for select to authenticated using (true);

drop policy if exists mission_equipments_insert_admin on public.mission_equipments;
create policy mission_equipments_insert_admin on public.mission_equipments
  for insert to authenticated
  with check (app_private.is_admin());

drop policy if exists mission_equipments_update on public.mission_equipments;
create policy mission_equipments_update on public.mission_equipments
  for update to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = mission_id and mt.technician_id = auth.uid()
    )
  )
  with check (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = mission_id and mt.technician_id = auth.uid()
    )
  );

drop policy if exists mission_equipments_delete_admin on public.mission_equipments;
create policy mission_equipments_delete_admin on public.mission_equipments
  for delete to authenticated
  using (app_private.is_admin());

-- ============================================================================
-- APRÈS EXÉCUTION : promouvoir votre premier administrateur (si nécessaire) :
--
--   update public.profiles set role = 'Admin' where email = 'votre@email.com';
--
-- ============================================================================
