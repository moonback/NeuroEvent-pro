-- ============================================================================
-- NeuroEventPlanning — Durcissement RLS (audit P0-2, juin 2026)
--
-- Problème : les politiques actuelles utilisent `using (true)` pour la lecture
-- de `missions`, `mission_technicians` et `mission_equipments`. Un technicien
-- connecté peut donc voir TOUTES les missions, tous les techniciens affectés
-- et tout le matériel réservé, même sur des missions auxquelles il ne participe
-- pas (fuite latérale entre clients).
--
-- Correctif : on filtre la lecture par appartenance (missions où le tech est
-- affecté via `mission_technicians`) et on verrouille l'écriture admin-only
-- sauf pour les champs explicitement autorisés aux techniciens (statut mission
-- et pointage `checked` du matériel).
--
-- Ce script est idempotent : il peut être rejoué sans danger. Il s'appuie
-- sur `app_private.is_admin()` défini dans la migration 20260610000000.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MISSIONS — SELECT : admin OU technicien affecté via mission_technicians
-- ----------------------------------------------------------------------------
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions
  for select to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = missions.id and mt.technician_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 2. MISSIONS — INSERT / DELETE : admin only
-- ----------------------------------------------------------------------------
-- (INSERT déjà admin-only — on recrée pour rester idempotent)
drop policy if exists missions_insert_admin on public.missions;
create policy missions_insert_admin on public.missions
  for insert to authenticated
  with check (app_private.is_admin());

drop policy if exists missions_delete_admin on public.missions;
create policy missions_delete_admin on public.missions
  for delete to authenticated
  using (app_private.is_admin());

-- ----------------------------------------------------------------------------
-- 3. MISSIONS — UPDATE : admin OU (technicien affecté ET uniquement sur
--    colonnes qu'il a le droit de toucher : statut + signature_url).
--    Un technicien ne doit PAS pouvoir réécrire le titre / client / dates /
--    camion / compétences via cette policy.
--    -> Solution : on conserve la possibilité pour le tech affecté de mettre
--       à jour `status` et `signature_url` et on BLOQUE les autres champs
--       via un trigger BEFORE UPDATE qui rejette tout changement non autorisé.
-- ----------------------------------------------------------------------------
drop policy if exists missions_update on public.missions;
create policy missions_update on public.missions
  for update to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = missions.id and mt.technician_id = auth.uid()
    )
  )
  with check (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = missions.id and mt.technician_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Trigger durcissant l'UPDATE par un technicien : seuls `status` et
--    `signature_url` peuvent changer. Tout autre champ levé => exception.
-- ----------------------------------------------------------------------------
create or replace function app_private.protect_mission_field_changes()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  allowed boolean := false;
  changes jsonb;
begin
  -- Admin : autorise tout.
  if app_private.is_admin() then
    return new;
  end if;

  -- Technicien affecté : on regarde ce qui a changé. Tout champ hors
  -- {status, signature_url} doit être identique à l'ancienne valeur.
  if exists (
    select 1 from public.mission_technicians mt
    where mt.mission_id = new.id and mt.technician_id = auth.uid()
  ) then
    -- Compare champ par champ : si une colonne "protégée" a changé, on rejette.
    if new.title            is distinct from old.title            then return old; end if;
    if new.type             is distinct from old.type             then return old; end if;
    if new.client           is distinct from old.client           then return old; end if;
    if new.client_id        is distinct from old.client_id        then return old; end if;
    if new.address          is distinct from old.address          then return old; end if;
    if new.start_date       is distinct from old.start_date       then return old; end if;
    if new.end_date         is distinct from old.end_date         then return old; end if;
    if new.truck_id         is distinct from old.truck_id         then return old; end if;
    if new.required_skills  is distinct from old.required_skills  then return old; end if;
    if new.color            is distinct from old.color            then return old; end if;
    -- `status` et `signature_url` sont les seuls librement modifiables par le tech :
    -- pas de check ici, on laisse passer la nouvelle valeur.
    return new;
  end if;

  -- Pas admin, pas affecté : on refuse en annulant silencieusement (RETURN OLD
  -- plutôt que RAISE pour rester compatible avec les batch updates qu'on
  -- pourrait faire en admin dans la même transaction).
  return old;
end;
$$;

drop trigger if exists missions_protect_fields on public.missions;
create trigger missions_protect_fields
  before update on public.missions
  for each row execute function app_private.protect_mission_field_changes();

-- ----------------------------------------------------------------------------
-- 5. MISSION_TECHNICIANS — SELECT : admin OU sa propre ligne
--    (évite qu'un tech liste les techniciens de TOUTES les missions)
-- ----------------------------------------------------------------------------
drop policy if exists mission_technicians_select on public.mission_technicians;
create policy mission_technicians_select on public.mission_technicians
  for select to authenticated
  using (
    app_private.is_admin()
    or technician_id = auth.uid()
    or exists (
      select 1 from public.mission_technicians mt2
      where mt2.mission_id = mission_technicians.mission_id
        and mt2.technician_id = auth.uid()
    )
  );

-- INSERT / UPDATE / DELETE : admin only (inchangé, recréé pour idempotence)
drop policy if exists mission_technicians_write on public.mission_technicians;
create policy mission_technicians_write on public.mission_technicians
  for all to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

-- ----------------------------------------------------------------------------
-- 6. MISSION_EQUIPMENTS — SELECT : suit la visibilité de la mission parente
--    (un tech ne voit le matériel que des missions où il est affecté).
--    Le pointage `checked` reste modifiable par lui.
-- ----------------------------------------------------------------------------
drop policy if exists mission_equipments_select on public.mission_equipments;
create policy mission_equipments_select on public.mission_equipments
  for select to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = mission_equipments.mission_id
        and mt.technician_id = auth.uid()
    )
  );

-- INSERT / DELETE : admin only
drop policy if exists mission_equipments_insert_admin on public.mission_equipments;
create policy mission_equipments_insert_admin on public.mission_equipments
  for insert to authenticated
  with check (app_private.is_admin());

drop policy if exists mission_equipments_delete_admin on public.mission_equipments;
create policy mission_equipments_delete_admin on public.mission_equipments
  for delete to authenticated
  using (app_private.is_admin());

-- UPDATE par un tech affecté : on autorise uniquement la colonne `checked`.
drop policy if exists mission_equipments_update on public.mission_equipments;
create policy mission_equipments_update on public.mission_equipments
  for update to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = mission_equipments.mission_id
        and mt.technician_id = auth.uid()
    )
  )
  with check (
    app_private.is_admin()
    or exists (
      select 1 from public.mission_technicians mt
      where mt.mission_id = mission_equipments.mission_id
        and mt.technician_id = auth.uid()
    )
  );

-- Trigger durcissant l'UPDATE par un non-admin sur mission_equipments :
-- seul `checked` peut changer, les autres colonnes doivent rester identiques.
create or replace function app_private.protect_equipment_field_changes()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if app_private.is_admin() then
    return new;
  end if;
  -- Non-admin : on ne laisse passer que les changements de `checked`.
  if new.mission_id  is distinct from old.mission_id  then return old; end if;
  if new.equipment_id is distinct from old.equipment_id then return old; end if;
  if new.quantity    is distinct from old.quantity    then return old; end if;
  return new;
end;
$$;

drop trigger if exists mission_equipments_protect_fields on public.mission_equipments;
create trigger mission_equipments_protect_fields
  before update on public.mission_equipments
  for each row execute function app_private.protect_equipment_field_changes();

-- ============================================================================
-- VÉRIFICATION RAPIDE (à exécuter séparément si besoin) :
--
--   select policyname, cmd from pg_policies
--   where schemaname='public' and tablename in ('missions','mission_technicians','mission_equipments')
--   order by tablename, policyname;
--
-- ============================================================================
