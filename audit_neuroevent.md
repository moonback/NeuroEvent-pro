# AUDIT TECHNIQUE COMPLET — NeuroEvent Planning v2.4

> Audit réalisé le 17 juin 2026. Basé sur l'analyse exhaustive de l'ensemble du code source fourni (React 18+, TypeScript, Supabase, Zustand, Tailwind CSS).

---

## 1. ANALYSE GLOBALE

### Compréhension du projet

**NeuroEvent** est une application de gestion d'événementiels destinée à une entreprise de prestation technique (son, lumière, scène, arcade). Elle couvre l'intégralité du cycle de vie d'une mission : planification, affectation des ressources humaines et matérielles, suivi terrain par les techniciens, et reporting post-événement.

### Objectif métier

Remplacer des outils disparates (tableurs, appels téléphoniques, papier) par une plateforme unique permettant à une équipe de planification (Admin) de piloter des équipes de terrain (Techniciens) avec suivi en temps réel.

### Public cible

Deux profils distincts, traités correctement avec deux interfaces séparées :
- **Administrateurs** : bureau, gestion planning, ressources, statistiques.
- **Techniciens** : mobile-first, actions terrain (pointer matériel, photos, signature, heures).

### Cas d'utilisation

- Création et planification de missions événementielles
- Affectation de techniciens, camions, matériel
- Détection de conflits de planning (doubles réservations, surstock)
- Dashboard mobile technicien avec scan QR, signature client, photos avant/après
- Suivi des heures travaillées par mission
- Import CSV de catalogue matériel
- Génération de fiches PDF imprimables

### Fonctionnalités principales

Toutes présentes et fonctionnelles : planning FullCalendar, Kanban, liste missions, tableau matériel, scan QR, signature, photos preuves, time logs, day logs, disponibilités techniciens, avatars, PWA, offline sync queue, pull-to-refresh, swipe gestures, statistiques Recharts.

### Points forts

- **Dual UX réussie** : l'admin a une interface desktop claire ; le technicien a un dashboard mobile dark ultra-soigné avec micro-interactions haptiques.
- **Architecture Supabase bien utilisée** : RLS, realtime, storage buckets, triggers.
- **Offline-first partiel** : sync queue pour le pointage matériel, cache Zustand persist.
- **Détection de conflits temps réel** : technicien déjà affecté, camion pris, stock insuffisant.
- **Qualité UX mobile technicien** : swipe-to-dismiss, pull-to-refresh, haptic feedback, bottom sheets — niveau Uber Driver.
- **Code splitting par route** (lazy loading) bien implémenté.
- **Parser CSV RFC 4180** fait maison, robuste.
- **Gestion des métadonnées dans required_skills** : hack ingénieux mais dangereux (voir section 6).

### Faiblesses majeures

- **Store Zustand monolithique** (1 800 lignes) : pas de séparation des responsabilités.
- **Métadonnées sérialisées dans un tableau de strings** (`meta:delivery:ISO`, `meta:report:...`) : anti-pattern majeur, fragile.
- **Checklist stockée uniquement en localStorage** : non synchronisée serveur, perte à la réinstallation.
- **Pas un seul test** dans le codebase.
- **CSVImportModal en dehors du composant** : états non réinitialisés à la fermeture (`if (!isOpen) return null` avec des useState déclarés avant).
- **`MissionModal.tsx` fait ~600 lignes** : trop lourd.
- **Rôle résolu depuis `profiles`** mais avec fallback sur `user_metadata` (modifiable côté client).
- **Pas de pagination** sur les listes.
- **Stats admin codées en dur** (12 missions actives, 3 alertes) dans `Settings.tsx`.

### Risques techniques

- Perte de données si le schéma `meta:` est mal parsé (crash silencieux).
- Leak de listeners realtime Supabase lors de hot-reload.
- Store persisté en localStorage peut contenir des données périmées.

### Risques métier

- Signature client stockée dans un bucket public sans vérification d'ownership → exposition légale.
- Absence de confirmation de lecture avant suppression définitive des missions terminées.

### Note globale : **7,0 / 10**

---

## 2. ARCHITECTURE

### Architecture générale

Stack : **Vite + React 18 + TypeScript + Zustand + Supabase + Tailwind CSS + FullCalendar**.

L'application est une SPA classique avec BFF (Backend as a Service) Supabase. Pas de couche serveur custom.

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigateur (SPA)                                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Admin UI    │  │ Technician UI   │  │ Auth (Supabase)  │   │
│  │ (Desktop)   │  │ (Mobile-first)  │  │                  │   │
│  └──────┬──────┘  └────────┬────────┘  └────────┬─────────┘   │
│         └─────────────────┬┴──────────────────────┘            │
│                    ┌──────▼──────┐                              │
│                    │ Zustand     │  (store monolithique)        │
│                    │ Store       │                              │
│                    └──────┬──────┘                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │ supabase-js
                    ┌───────▼───────┐
                    │  Supabase     │
                    │  ┌─────────┐  │
                    │  │ Auth    │  │
                    │  ├─────────┤  │
                    │  │ DB/RLS  │  │
                    │  ├─────────┤  │
                    │  │ Storage │  │
                    │  ├─────────┤  │
                    │  │Realtime │  │
                    │  └─────────┘  │
                    └───────────────┘
```

### Architecture idéale proposée

```
src/
├── features/                    # Feature-based modules
│   ├── missions/
│   │   ├── store.ts             # slice Zustand dédié
│   │   ├── api.ts               # toutes les requêtes Supabase
│   │   ├── types.ts
│   │   └── components/
│   ├── technicians/
│   ├── equipment/
│   ├── planning/
│   └── auth/
├── shared/
│   ├── components/ui/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── pages/                       # Routage seulement
└── app/                         # Bootstrap, router, providers
```

### Découpage des responsabilités

**Problème [Élevé]** : `src/store/index.ts` (≈ 1 800 lignes) contient les mappers, la logique métier, les appels API, la gestion d'erreurs, la serialisation — tout à la fois. Une modification d'une entité risque de casser une autre.

**Impact** : maintenabilité catastrophique à l'échelle.

**Solution recommandée** : découper en slices Zustand indépendants (`useMissionsStore`, `useTechnicianStore`, etc.) combinés avec `zustand/middleware/combine` ou `createSlice` pattern.

### Séparation Front / Back

La séparation est correcte mais la logique métier fuites côté front :
- La détection de conflits (`lib/conflicts.ts`, `lib/stock.ts`) est 100 % côté client → risque de contournement.
- Les calculs de réservation devraient idéalement être des fonctions SQL/Postgres côté Supabase.

### Modularité : **5/10** — Organisation par type de fichier, pas par fonctionnalité.

### Maintenabilité : **5/10** — Store monolithique, composants trop longs.

### Évolutivité : **6/10** — La base Supabase est bien structurée, mais le front ne suit pas.

### Dette technique estimée : **3-4 semaines pour une équipe de 2**.

---

## 3. QUALITÉ DU CODE

### Lisibilité

Bonne globalement. Les noms de variables sont explicites (`overlappingMissions`, `computeReservedByWindow`), les commentaires JSDoc sont présents dans les fichiers critiques (`lib/stock.ts`, `lib/conflicts.ts`).

### Duplication — **Problème [Élevé]**

La fonction `renderPhotoSection` est dupliquée à l'identique dans `DrawerTabs.tsx` (onglets `ReportTab` et `PhotosTab`). Idem pour `formatDuration` présente dans `TechnicianHoursAdmin.tsx` ET `TimeLogPanel.tsx`.

**Solution** : extraire dans des hooks/composants partagés.

### Conventions

Cohérentes : PascalCase pour composants, camelCase pour fonctions/variables, SCREAMING_SNAKE pour constantes. Les classes Tailwind sont longues mais organisées.

### Nomenclature

Quelques incohérences : `handleSubmitAdd` / `handleSubmitEdit` dans `TimeLogPanel.tsx` — préférer `handleAddTimeLog` / `handleEditTimeLog`.

### Typage — **Problème [Moyen]**

- Plusieurs `any` dans le store (`driver_license: any`) et dans `DrawerTabs.tsx` (`mission: any`, `tech: any`).
- `MissionRowWithRelations` est un cast manuel fragile — risque de désynchronisation avec le schéma réel.
- La sérialisation `meta:delivery:ISO` dans un `string[]` est non typée par construction.

### Gestion des erreurs — **Problème [Élevé]**

- `reportError()` affiche un toast et log en console mais **ne lève pas d'exception** : après une erreur, le code continue d'exécuter les instructions suivantes (`await get().fetchMissions()` après un `return` conditionnel manqué parfois).
- Erreurs réseau dans `QRScannerModal` : la callback `onScan` supprime silencieusement les messages d'erreur de parsing (`(errorMessage) => {}`).
- Dans `SignaturePad`, `fetch(dataUrl)` peut échouer silencieusement.

### Cohérence

Le pattern optimiste est appliqué dans `toggleEquipmentCheck` et `deleteMission` mais pas dans les autres mutations. L'UX est incohérente (certaines actions sont immédiates, d'autres attendent le refetch).

### Complexité — **Problème [Moyen]**

`useTechDashboard.ts` fait 320 lignes et gère UI state, data fetching, drag gestures, network sync, photo upload, scan QR — tout à la fois. Complexité cyclomatique élevée.

### Composants trop volumineux

- `MissionModal.tsx` : ~600 lignes (devrait être ≤ 200)
- `DrawerTabs.tsx` : ~1 200 lignes (problème critique)
- `Settings.tsx` : ~700 lignes
- `store/index.ts` : ~1 800 lignes

### Améliorations listées

1. Extraire `renderPhotoSection` en `<PhotoGrid>` partagé
2. Typer `mission: any` dans DrawerTabs avec l'interface `Mission`
3. Décomposer `DrawerTabs.tsx` en fichiers séparés par onglet
4. Centraliser `formatDuration` dans `lib/time.ts`
5. Remplacer les `any` par des types stricts ou `unknown`
6. Uniformiser le pattern optimiste sur toutes les mutations

---

## 4. FRONTEND

### React & Hooks

Usage correct de `useMemo`, `useCallback`, `useEffect`. `useSyncExternalStore` dans `useMediaQuery.ts` est une excellente pratique React 18.

### Gestion du state — **Problème [Élevé]**

Un seul store global Zustand pour TOUT l'état applicatif. En production avec 50+ missions, chaque mutation déclenche un re-render de tous les composants abonnés.

**Recommandation** : slices Zustand + sélecteurs atomiques (`state => state.missions.filter(...)` devraient être mémoïsés à l'extérieur du composant).

### Performances

**Problème [Moyen]** : dans `MissionModal.tsx`, le calcul `categorizedTechs` (useMemo) inclut `missions`, `technicians`, `unavailabilities` comme dépendances, mais aussi `requiredSkills` qui change à chaque toggle — cela recalcule inutilement la liste complète des techniciens à chaque compétence cochée.

### Lazy loading

Bien implémenté via `React.lazy()` pour toutes les pages. ✅

### Re-renders inutiles

Dans `DrawerTabs.tsx`, les sous-composants (`GeneralTab`, `ClientTab`, etc.) sont des fonctions déclarées dans le même fichier, ré-instanciées à chaque render parent. Ils ne sont pas mémoïsés avec `React.memo`.

### Architecture des composants — **Problème [Élevé]**

`MissionDrawer.tsx` reçoit 25+ props. C'est un signal architectural fort : le composant fait trop de choses. Un pattern Context ou une composition d'hooks plus fine s'impose.

### Responsive

Le dual UX (admin desktop / technicien mobile) est bien géré via `useIsMobile()`. Les modales s'adaptent correctement en bottom-sheet sur mobile.

### Accessibilité — **Problème [Moyen]**

- `MissionCard.tsx` utilise des `div` avec handlers tactiles mais sans `role="button"` ni `tabIndex`.
- Les drag gestures (swipe, pull-to-refresh) n'ont pas d'alternative clavier.
- Certains boutons iconiques n'ont pas de `aria-label` (ex: boutons +/- quantité dans MissionModal).
- Le contraste des textes `text-[#94a3b8]` sur fond blanc passe WCAG AA, mais certains labels `tech-dark` à `opacity: 0.45` ne passent pas.

### SEO

Non applicable (app métier derrière authentification). ✅

### PWA

`vite-plugin-pwa` présent avec Service Worker. Offline-ready partiel. ✅

### Animations

Excellentes dans la partie technicien : animations staggerées, spring cubic-bezier, haptique. Portion admin sobre et appropriée.

### UX admin — **Problème [Faible]**

Le formulaire de mission sur mobile passe en mode wizard (étapes) — bien pensé. Sur desktop, les 3 onglets sont clairs. Cependant, aucun `autofocus` sur les champs principaux à l'ouverture des modales.

### Mauvaises pratiques détectées

- `window.confirm()` pour les suppressions et les conflits : bloquant, non stylé, non accessible. À remplacer par une `ConfirmModal`.
- Checklist stockée dans `localStorage` avec clé `eventflow_checklist_${userId}_${missionId}` : peut entrer en conflit entre onglets.
- Styles inline en dur (`style={{ color: '#ff4d6d' }}`) mélangés avec Tailwind : incohérent.

---

## 5. BACKEND (Supabase)

### Architecture API

Supabase BaaS avec Postgres, RLS, Storage, Realtime. Pas de serveur custom, ce qui est une limitation pour la logique métier complexe.

### Organisation des endpoints

Tous les appels passent par `supabase-js` dans le store. Pas d'abstraction de couche repository — le store est à la fois state manager ET data access layer.

### Validation — **Problème [Élevé]**

**Aucune validation côté client** au niveau des formulaires hormis les attributs HTML `required`, `min`, `type`. Il n'y a pas de schéma Zod ou Yup. La validation repose uniquement sur les contraintes PostgreSQL côté serveur.

**Impact** : des données malformées peuvent atteindre la base (ex : `totalQuantity = -1` si l'utilisateur contourne le `min="1"` via DevTools).

### Logique métier — **Problème [Moyen]**

La sérialisation des métadonnées de mission dans `required_skills[]` :
```
meta:delivery:2026-06-17T14:00:00.000Z
meta:pickup:2026-06-18T08:00:00.000Z
meta:report:Projet%20termin%C3%A9
```
C'est un **anti-pattern sévère**. Ces champs devraient être des colonnes SQL dédiées (`delivery_date`, `pickup_date`, `setup_duration`, `report`, `photo_before_url`, `photo_after_url`).

**Risques** : parsing fragile, requêtes SQL impossibles sur ces champs, encodage/décodage URI dans des strings.

### Sécurité API

Le client Supabase utilise la clé `anon` exposée côté client — c'est le fonctionnement prévu avec RLS. La sécurité réelle dépend donc entièrement de la qualité des politiques RLS (non auditables ici car non fournies).

### Robustesse — **Problème [Moyen]**

`fetchMissions()` charge toutes les missions sans pagination ni filtre de date. En production avec 500+ missions, la requête sera lente et le bundle de données volumineux.

### Gestion des erreurs

`reportError()` est centralisé et cohérent. ✅ Mais les erreurs réseau dans `processSyncQueue` stoppent la queue au premier échec (pas de retry exponentiel).

### Séparation des couches

Absente : le store mélange data fetching, mapping, state management, et logique métier. Recommandation : séparer en `api/missions.ts` (requêtes Supabase pures) + `store/missionsSlice.ts` (state).

---

## 6. BASE DE DONNÉES

### Modèle relationnel

Bien conçu dans l'ensemble. Tables identifiées :
- `profiles`, `technicians`, `technician_unavailabilities`
- `trucks`, `equipments`, `clients`
- `missions`, `mission_technicians`, `mission_equipments`
- `mission_time_logs`, `mission_photos`, `technician_day_logs`
- `admin_preferences`

### Normalisation — **Problème Critique**

La table `missions` possède une colonne `required_skills TEXT[]` qui stocke en réalité 7 types de données hétérogènes via des préfixes `meta:` :

```sql
-- Ce qui devrait être 6 colonnes distinctes est stocké ainsi :
required_skills = [
  'sono', 'eclairage',               -- vraies compétences
  'meta:delivery:2026-06-17T...',    -- date de livraison
  'meta:pickup:2026-06-18T...',      -- date de reprise
  'meta:setup:120',                  -- durée montage
  'meta:report:Projet%20termin%C3%A9', -- rapport texte
  'meta:photo:before:https://...'   -- URL photo
]
```

**Gravité : Critique.** Ce hack viole la 1NF, rend les requêtes SQL sur ces champs impossibles, et fragilise toute l'application.

**Solution : migration SQL urgente :**
```sql
ALTER TABLE missions
  ADD COLUMN delivery_date TIMESTAMPTZ,
  ADD COLUMN pickup_date TIMESTAMPTZ,
  ADD COLUMN setup_duration INTEGER,
  ADD COLUMN report TEXT,
  ADD COLUMN photo_before_url TEXT,
  ADD COLUMN photo_after_url TEXT;
```

### Index — **Problème [Élevé]**

Sans voir le schéma SQL complet, les index critiques manquants probables :
- `mission_technicians(technician_id)` — pour `fetchMissions()` avec jointure
- `mission_time_logs(mission_id, technician_id)`
- `technician_unavailabilities(technician_id, start_date, end_date)`
- `missions(start_date, end_date)` — pour les requêtes par plage de dates

### Clés étrangères

Correctement définies d'après le modèle Supabase déduit. Les suppressions en cascade semblent gérées (`mission_technicians`, `mission_equipments`).

### Performances SQL — **Problème [Élevé]**

`fetchMissions()` effectue une jointure `missions + mission_technicians + mission_equipments` sans filtre, ramenant potentiellement des milliers de lignes. À 500 missions avec 10 équipements chacune = 5 000 lignes `mission_equipments` + N lignes `mission_technicians`.

**Solution** : pagination côté serveur + filtrage par plage de dates (`start_date >= NOW() - INTERVAL '3 months'`).

### Évolutivité

Le modèle relationnel est extensible. Les table de jointure (`mission_technicians`, `mission_equipments`) permettent des relations N:N propres. ✅

### Architecture optimale proposée

```sql
-- Colonnes manquantes à ajouter à missions
ALTER TABLE missions ADD COLUMN delivery_date TIMESTAMPTZ;
ALTER TABLE missions ADD COLUMN pickup_date TIMESTAMPTZ;
ALTER TABLE missions ADD COLUMN setup_duration INTEGER; -- en minutes
ALTER TABLE missions ADD COLUMN report TEXT;

-- Index critiques manquants
CREATE INDEX idx_missions_dates ON missions(start_date, end_date);
CREATE INDEX idx_mission_tech ON mission_technicians(technician_id);
CREATE INDEX idx_time_logs_tech ON mission_time_logs(technician_id, start_time);
CREATE INDEX idx_unavail_tech ON technician_unavailabilities(technician_id, start_date);

-- Nettoyage de required_skills : migration des meta: vers les nouvelles colonnes
UPDATE missions SET
  delivery_date = (
    SELECT regexp_replace(s, 'meta:delivery:', '')::TIMESTAMPTZ
    FROM unnest(required_skills) s WHERE s LIKE 'meta:delivery:%' LIMIT 1
  ),
  pickup_date = ...
  -- etc.
```

---

## 7. SÉCURITÉ

### Authentification

Supabase Auth (email/password). Le rôle est résolu depuis `profiles` (côté serveur) avec fallback sur `user_metadata` — ce fallback est une vulnérabilité potentielle car `user_metadata` est modifiable par l'utilisateur.

**Gravité : Élevée.**

```typescript
// auth.ts — fallback dangereux
return (user.user_metadata?.role as UserRole) || 'Technicien';
```

**Solution** : supprimer le fallback sur `user_metadata`. Si `profiles` n'est pas accessible, retourner `null` et bloquer l'accès.

### Autorisation — **Problème [Élevé]**

La vérification de rôle côté front (`isAdmin`, `role === 'Admin'`) est uniquement cosmétique. Elle cache des routes mais n'empêche pas un technicien d'appeler directement les fonctions du store ou l'API Supabase.

**La vraie barrière doit être les politiques RLS.** Sans voir le fichier de migration SQL, on ne peut pas garantir leur robustesse.

### RLS

Présumé configuré (l'application fonctionne) mais non auditable ici. Points de vigilance :
- `profiles` : un technicien peut-il lire les profils des autres ?
- `mission_photos` : un technicien peut-il supprimer les photos d'une autre mission ?
- `admin_preferences` : seul l'admin peut-il lire/écrire ses préférences ?

### JWT

Géré par Supabase. Le token est stocké dans `localStorage` (comportement par défaut de supabase-js) — exposition aux attaques XSS.

**Solution** : configurer `storageKey` avec un cookie HttpOnly (nécessite un proxy serveur) ou accepter le risque avec une CSP stricte.

### Injections SQL

Pas de risque direct car tout passe par le client Supabase typé qui paramètre les requêtes. ✅

### XSS — **Problème [Moyen]**

- `dangerouslySetInnerHTML` non utilisé. ✅
- Le rapport du technicien (`mission.report`) est affiché via `whitespace-pre-wrap` sans sanitisation — si du HTML est injecté, React l'échappe automatiquement. ✅
- Les URLs d'images (`photo.url`, `signatureUrl`) sont injectées dans des `<img src>` sans validation du domaine — risque de content spoofing.

### CSRF

Non applicable en SPA pure avec JWT Bearer. ✅

### Stockage des secrets

`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` exposés côté client — c'est le fonctionnement prévu de Supabase. La clé `anon` est publique par design. ✅

Attention : si une clé `service_role` est utilisée quelque part en front, c'est critique. Non détecté dans le code.

### Uploads — **Problème [Élevé]**

- Pas de validation de type MIME côté serveur pour `mission-photos` — seul le `accept="image/*"` côté HTML est vérifié.
- Pas de limite de taille serveur configurée dans le code (dépend de la config du bucket Supabase).
- Les fichiers `signature_*.png` dans le bucket `signatures` et `mission-photos` sont supposément publics — n'importe qui avec l'URL peut les consulter.

**Solution** : activer les policies RLS sur Storage + transformer les URLs en signed URLs pour les assets sensibles.

### API publiques

Aucune route API custom. Toutes les requêtes passent par le client Supabase authentifié. ✅

### Validation utilisateur — **Problème [Moyen]**

Lors de l'inscription, le rôle `Technicien` est défini dans `user_metadata` ET une ligne est insérée dans `profiles` ET `technicians`. Si l'une des deux insertions échoue, l'état est incohérent (compte auth sans profil).

**Solution** : transférer ces insertions dans un trigger Postgres `AFTER INSERT ON auth.users`.

### Score de sécurité : **52 / 100**

Points perdus : fallback user_metadata (+8 points si supprimé), RLS Storage non configuré (+12), validation MIME manquante (+10), JWT localStorage (+8), validation formulaires absente (+10).

---

## 8. PERFORMANCES

### Requêtes — **Problème [Élevé]**

`initialize()` lance 6 requêtes parallèles au démarrage — correct. Mais `fetchMissions()` charge toutes les missions sans limite : avec 1 000 missions, on transfère ~500 KB de JSON brut.

### Appels API

`updateMission()` appelle `fetchMissions()` après chaque mise à jour pour synchroniser l'état — c'est un refetch complet pour une modification partielle. Avec l'optimistic update, ce refetch est redondant et coûteux.

**Solution** : remplacer par un patch local du state après mutation réussie (pattern déjà utilisé pour `deleteMission` mais pas généralisé).

### Cache

Zustand persist en localStorage sert de cache offline. Pas de cache HTTP (Supabase REST ne bénéficie pas de ETag/Cache-Control côté client).

### Bundle

Code splitting par route bien fait. À vérifier : `FullCalendar` est un bundle lourd (~400 KB gzip) chargé sur 4 pages différentes.

**Optimisation** : vérifier qu'une seule instance FullCalendar est dans le bundle via `vite-bundle-visualizer`.

### Optimisation React

`DrawerTabs.tsx` : les sous-composants ne sont pas mémoïsés avec `React.memo`. Chaque ouverture/fermeture d'onglet re-rend inutilement tous les onglets inactifs.

### Optimisation SQL

Priorité haute : ajouter les index listés en section 6.

### Optimisation réseau

Images compressées côté client avant upload (côté `addMissionPhoto` : resize à 1920px, JPEG 0.82). ✅

Les avatars utilisent un pipeline de compression WebP avec crop carré centré. ✅

### Optimisation images

Lazy loading sur `<img loading="lazy">` utilisé dans `UserAvatar`. ✅ Pas de `srcset` ni `WebP fallback` pour les photos de mission.

### Classement des optimisations par impact

| Priorité | Optimisation | Impact estimé |
|----------|-------------|---------------|
| 1 | Pagination `fetchMissions()` (limit 100, date range) | -80% données transférées |
| 2 | Éliminer `fetchMissions()` post-mutation | -60% requêtes redondantes |
| 3 | Index SQL sur `missions(start_date)` | -70% temps requête filtrage |
| 4 | Mémoïsation sous-composants DrawerTabs | -30% re-renders |
| 5 | Lazy loading photos de mission | -50% LCP mobile |

---

## 9. EXPÉRIENCE UTILISATEUR

### Ergonomie admin

Bonne. La navigation latérale est claire, les catégories (`Opérations`, `Ressources`, `Gestion`, `Outils`) sont logiques. Le bouton `+ Nouvelle Mission` est accessible depuis l'en-tête et en FAB mobile.

### Ergonomie technicien — **Excellente**

L'interface technicien est un point fort majeur de l'application :
- Swipe left/right sur les cartes mission
- Pull-to-refresh natif
- Bottom sheets animées
- Haptique contextuel (click/success/error)
- Lock de navigation pendant une mission en cours (empêche les erreurs)

### Fluidité

Les animations du portail technicien sont fluides et bien calibrées (cubic-bezier spring). L'interface admin est sobre mais réactive.

### Parcours utilisateur — **Problème [Moyen]**

Lors de la suppression d'une ressource (mission, technicien, camion), le confirmation via `window.confirm()` est bloquante et visuellement rupturiste. Une modal de confirmation stylée améliorerait significativement l'expérience.

### Feedback utilisateur

Système de toasts bien implémenté avec swipe-to-dismiss. ✅

Cependant, pas d'état de chargement visible sur certaines actions (ex: création de mission — le bouton n'est pas désactivé pendant l'insertion).

### Mobile

Excellent pour le technicien. La page admin sur mobile est fonctionnelle mais dense (calendrier FullCalendar sur petit écran).

### Améliorations concrètes proposées

1. Remplacer `window.confirm()` par une `<ConfirmationModal>` réutilisable
2. Ajouter `disabled` + spinner sur les boutons pendant les mutations
3. Ajouter un mode `dark` optionnel pour l'interface admin
4. Ajouter une vue `Liste` sur le planning (FullCalendar liste) pour mobile
5. Ajouter un système de notification in-app (badge de conflits en temps réel)
6. Proposer un onboarding guidé pour les nouveaux techniciens

---

## 10. DESIGN UI

### Hiérarchie visuelle

**Admin** : bonne. Titres en uppercase bold, labels en 10px uppercase tracking-wider, contenu en 14px. La hiérarchie est respectée.

**Technicien** : excellente. Usage sophistiqué des gradients, glows, badges colorés. La distinction urgence / neutre est immédiate.

### Couleurs

**Admin** : palette froide cohérente (`#0f172a`, `#2563eb`, `#f8fafc`). Strictement respectée dans tous les composants.

**Technicien** : dark palette soignée avec CSS variables (`--tech-accent: #00e5a0`, `--tech-blue: #4d9fff`, `--tech-danger: #ff4d6d`). Cohérente.

**Problème [Faible]** : la duplication de classes Tailwind hardcodées (`bg-[#2563eb]`, `text-[#0f172a]`) rend le theming difficile. Des tokens CSS auraient été préférables.

### Spacing

Cohérent. Usage systématique de `gap-3`, `p-4`, `px-6 py-3.5`. Pas d'espacement aléatoire.

### Composants

Bonne réutilisation : `<Modal>`, `<UserAvatar>`, `<Toaster>`, `<ImageLightbox>`. Le composant `<Modal>` centralise correctement les comportements (Escape, backdrop click, aria).

### Contrastes — **Problème [Moyen]**

Dans l'interface technicien :
- `color: 'var(--tech-text-muted)'` avec `opacity: 0.45` → ratio de contraste estimé < 3:1 (fail WCAG AA).
- Les labels `text-[9px]` sont illisibles sur certains appareils Android avec écrans bas de gamme.

### Responsive

**Admin** : responsive correct. Les grilles s'adaptent (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`). ✅

**Technicien** : `max-w-md mx-auto` fixe la largeur sur tablettes — correct pour une app mobile.

### Professionnalisme

L'interface technicien est d'un niveau professionnel très élevé, comparable à des apps consumer premium (Uber, Deliveroo). L'interface admin est propre et fonctionnelle mais moins distinctive.

### Note UI : **8 / 10**

---

## 11. QUALITÉ DU PRODUIT

### Maturité

L'application est fonctionnellement complète pour un premier déploiement en conditions réelles. Les fonctionnalités core sont toutes implémentées et interconnectées.

### Niveau professionnel

**Technicien** : production-ready sur la forme.
**Admin** : MVP avancé sur la forme, des correctifs de fond requis avant commercialisation.

### Capacité à être commercialisé

**Non encore.** Les blockers sont :
1. Anti-pattern `meta:` dans `required_skills` → risque de corruption de données
2. Aucun test → régressions non détectables
3. Validation de formulaires absente → données invalides en base
4. Signature et photos dans des buckets potentiellement publics → risque légal (RGPD)
5. Pagination manquante → performance dégradée à l'échelle

### Stabilité

Acceptable en équipe réduite (< 50 missions). Des erreurs non critiques surviennent silencieusement (erreurs réseau swallowées).

### Confiance utilisateur

Le portail technicien inspire confiance par son soin UX. Le portail admin a des `window.confirm()` et des statistiques codées en dur qui nuisent à la crédibilité.

### Ce qui manque pour un lancement en production

1. Migration SQL des colonnes `meta:` → colonnes dédiées
2. Pagination et filtrage des missions
3. Tests (unitaires a minima sur les fonctions critiques de `lib/`)
4. Validation Zod sur tous les formulaires
5. Politiques RLS Storage vérifiées et documentées
6. Suppression du fallback `user_metadata` pour le rôle
7. Signed URLs pour les assets sensibles (signatures, photos)
8. Monitoring (Sentry ou équivalent)
9. CI/CD pipeline
10. Documentation technique minimale

---

## 12. DETTE TECHNIQUE

### Problèmes prioritaires (P0 — blocker production)

1. **Anti-pattern `meta:` dans `required_skills`** — migration SQL urgente
2. **Store monolithique 1 800 lignes** — maintenabilité bloquée
3. **Aucun test** — régressions non détectables
4. **Validation formulaires absente** — données corrompues possibles
5. **`fetchMissions()` sans pagination** — performance dégradée à l'échelle

### Problèmes secondaires (P1 — important)

6. **Fallback `user_metadata` pour le rôle** — faille de sécurité
7. **RLS Storage non documenté / potentiellement manquant**
8. **Composants trop volumineux** (`DrawerTabs.tsx`, `MissionModal.tsx`)
9. **`window.confirm()` pour suppressions** — UX cassée
10. **Leak potentiel de listeners Supabase realtime** en hot-reload

### Quick wins (P2 — rapide et impactant)

11. Extraire `formatDuration` dans `lib/time.ts`
12. Extraire `renderPhotoSection` en composant partagé `<PhotoGrid>`
13. Ajouter `disabled` sur les boutons de soumission pendant les mutations
14. Supprimer les stats codées en dur dans `Settings.tsx`
15. Ajouter `autofocus` sur les premiers champs des modales

### Améliorations long terme (P3)

16. Migration vers une architecture feature-based
17. Ajout d'un layer API (`src/api/`) séparé du store
18. Calcul de conflit et de stock côté Postgres (fonctions SQL)
19. Internationalisation (i18n) — structure déjà présente dans les préférences
20. Theming CSS variables admin (actuellement hardcodé Tailwind)

---

## 13. SCALABILITÉ

### 100 utilisateurs — ✅ Supporté

L'application est stable. Supabase Free peut gérer ce volume. Les 6 requêtes de démarrage parallèles sont acceptables.

### 1 000 utilisateurs — ⚠️ Supporté avec dégradation

`fetchMissions()` sans pagination devient problématique si 200 missions par client (~1 000 lignes avec relations). Le realtime Supabase peut saturer. La queue de sync offline peut grossir.

**Actions requises** : pagination, index SQL, retirer le refetch systématique post-mutation.

### 10 000 utilisateurs — ❌ Non supporté

- Supabase connection pooling saturé
- `fetchMissions()` retourne des dizaines de milliers de lignes
- Realtime subscriptions : limite de connexions simultanées atteinte
- Zustand persist localStorage surchargé

**Actions requises** : passage à Supabase Pro ou auto-hosted, architecture multi-tenant dédiée, paginations profondes, cache Redis, CDN pour les assets.

### 100 000 utilisateurs — ❌ Non supporté (re-architecture nécessaire)

L'architecture BaaS pure atteint ses limites. Nécessiterait :
- Backend custom (NestJS / Hono) avec Postgres managé
- Queues (BullMQ) pour les opérations async (import CSV, notifications)
- CDN Cloudflare / Cloudfront pour les assets
- Read replicas Postgres
- Sharding si multi-tenant

---

## 14. MAINTENABILITÉ

### Facilité d'évolution — **5/10**

Ajouter un nouveau type de ressource (ex: `Personnel externe`) nécessiterait de modifier le store monolithique, les types, les conflits, les migrations SQL, et plusieurs composants. Pas de pattern d'extension claire.

### Facilité de debug — **6/10**

Les erreurs Supabase sont toastées et loggées. Mais sans numéro de ligne ni stack trace enrichie. Pas de Sentry ni de log structuré.

### Facilité d'ajout de fonctionnalités — **5/10**

La partie technicien est extensible via de nouveaux `DrawerTab`. La partie admin est moins modulaire.

### Lisibilité pour un nouveau développeur — **6/10**

Le code est commenté à des endroits clés (`lib/stock.ts`, `store/auth.ts`). Mais le store de 1 800 lignes et `DrawerTabs.tsx` de 1 200 lignes découragent l'onboarding.

### Améliorations proposées

1. Ajouter un `README.md` technique avec schéma d'architecture
2. Documenter le pattern `meta:` (ou le supprimer)
3. Ajouter des tests JSDoc avec exemples pour `lib/conflicts.ts` et `lib/stock.ts`
4. Introduire un `CONTRIBUTING.md` avec conventions
5. Configurer ESLint avec des règles de complexité cyclomatique max

---

## 15. DEVOPS

### Déploiement

Non spécifié dans le code (pas de `Dockerfile`, `railway.json`, `netlify.toml`, `.github/workflows`). Probablement déployé manuellement sur Vercel ou Netlify via CLI.

**Problème [Moyen]** : absence de pipeline de déploiement automatisé.

### CI/CD — **Absent**

Aucun fichier de configuration CI détecté. Toute modification est déployée sans validation automatique.

**Solution recommandée** :
```yaml
# .github/workflows/ci.yml
- lint (ESLint)
- typecheck (tsc --noEmit)
- test (Vitest)
- build (vite build)
- preview deploy (Vercel Preview URL)
```

### Gestion des environnements — **Problème [Moyen]**

Deux variables d'environnement seulement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Pas de séparation `dev` / `staging` / `prod` visible dans le code.

**Solution** : `.env.development`, `.env.staging`, `.env.production` + Supabase projects distincts par environnement.

### Variables d'environnement

Correctement gérées via `import.meta.env`. ✅ Le `.env` ne doit pas être commité (à vérifier dans `.gitignore`).

### Monitoring — **Absent**

Aucun monitoring applicatif. Les erreurs JS silencieuses (toasts) ne remontent pas à un système centralisé.

**Solution** : Sentry (frontend) + Supabase Logs (API) + Betterstack ou Grafana Cloud pour les métriques.

### Logs

Uniquement `console.error()` et `console.log()`. Pas de log structuré (JSON) ni de niveaux de sévérité.

### Sauvegardes

Gérées par Supabase (backups quotidiens sur plans Pro+). Sur Free, pas de backup automatique → **risque de perte de données**.

### Observabilité — **2/10**

Nulle à ce stade. Recommandations : Core Web Vitals (Vercel Analytics ou Plausible), error tracking (Sentry), API latency (Supabase Dashboard).

---

## 16. TESTS

### Couverture actuelle

**0 %** — Aucun fichier de test détecté dans le codebase.

### Zones les plus critiques à tester en priorité

**Tests unitaires (Vitest)**
- `lib/conflicts.ts` : `getDraftConflicts`, `rangesOverlap`
- `lib/stock.ts` : `reservedQuantityFor`, `checkStockShortages`
- `store/auth.ts` : `resolveRole` avec différents scénarios
- `CSVImportModal` : `parseCSV` avec cas limites (guillemets, CRLF, encoding)

**Tests d'intégration (Vitest + MSW)**
- Création d'une mission avec technicien → vérification du state Zustand
- Import CSV → vérification upsert Supabase
- Détection de conflit lors du planning

**Tests end-to-end (Playwright)**
- Scénario complet admin : connexion → création mission → affectation technicien
- Scénario technicien : connexion → démarrage mission → scan QR → signature → rapport
- Scénario de conflit : deux missions avec même technicien au même créneau

### Stratégie complète recommandée

```
Phase 1 (semaine 1) : Unitaires sur lib/
  → 15 tests, couverture > 90 % sur lib/conflicts.ts et lib/stock.ts

Phase 2 (semaine 2) : Unitaires sur store/
  → 20 tests, focus sur mutations et reducers purs

Phase 3 (semaine 3) : Intégration avec MSW
  → Mocker Supabase pour les workflows CRUD

Phase 4 (semaine 4) : E2E Playwright
  → 5 scénarios critiques smoke test

Objectif : 60 % de couverture totale, 100 % sur lib/
```

---

## 17. FONCTIONNALITÉS MANQUANTES

### Indispensables (bloquent la commercialisation)

1. **Pagination des listes** (missions, matériel) — perf critique
2. **Notifications in-app** — un technicien doit être alerté d'une nouvelle affectation
3. **Confirmation de suppression stylée** — remplacer `window.confirm()`
4. **Validation des formulaires** (Zod) — intégrité des données
5. **Historique des modifications** — audit trail sur les missions (qui a fait quoi)

### Importantes (valeur produit significative)

6. **Export PDF de rapport de mission** depuis la page MissionDetail
7. **Recherche globale** (missions, clients, matériel en un seul champ)
8. **Tableau de bord admin** — widget KPIs temps réel (missions du jour, techniciens en cours)
9. **Multi-langue** — structure déjà présente dans les préférences mais non implémentée
10. **Gestion des récurrences** — une mission hebdomadaire ne peut pas être dupliquée facilement
11. **Module facturation** — génération de devis/facture depuis une mission
12. **Messagerie interne** — chat admin ↔ technicien par mission

### Optionnelles (différenciation produit)

13. **Intégration Google Maps** pour visualiser les missions sur une carte
14. **Mode sombre admin** — déjà présent côté technicien
15. **Application mobile native** (React Native / Capacitor) pour les stores
16. **Intégration Google Calendar / Outlook** — export ICS des missions
17. **Module RH** — contrats, congés, paie des techniciens
18. **API REST publique** — pour intégration avec d'autres logiciels (ERP, CRM)

---

## 18. PLAN D'AMÉLIORATION

### PHASE 1 — Urgent (0-4 semaines)

| Tâche | Difficulté | Temps estimé | Impact | Priorité |
|-------|-----------|-------------|--------|----------|
| Migration SQL : colonnes dédiées (delivery_date, etc.) | Élevée | 3 jours | Critique | P0 |
| Suppression du fallback user_metadata | Faible | 2h | Critique sécurité | P0 |
| Validation Zod sur les formulaires clés | Moyenne | 4 jours | Élevé | P0 |
| Remplacer window.confirm() par ConfirmModal | Faible | 1 jour | Moyen | P0 |
| Ajouter index SQL critiques | Faible | 2h | Élevé perf | P0 |
| Tests unitaires lib/conflicts.ts et lib/stock.ts | Faible | 2 jours | Élevé | P0 |

### PHASE 2 — Important (1-2 mois)

| Tâche | Difficulté | Temps estimé | Impact | Priorité |
|-------|-----------|-------------|--------|----------|
| Pagination fetchMissions() | Moyenne | 3 jours | Élevé perf | P1 |
| Décomposer store en slices | Élevée | 5 jours | Maintenabilité | P1 |
| Décomposer DrawerTabs.tsx | Moyenne | 3 jours | Maintenabilité | P1 |
| CI/CD pipeline GitHub Actions | Faible | 1 jour | Déploiement | P1 |
| Sentry + monitoring | Faible | 1 jour | Observabilité | P1 |
| Notifications in-app (Supabase Realtime) | Moyenne | 4 jours | Produit | P1 |
| RLS Storage vérification et durcissement | Moyenne | 2 jours | Sécurité | P1 |

### PHASE 3 — Optimisation (2-4 mois)

| Tâche | Difficulté | Temps estimé | Impact | Priorité |
|-------|-----------|-------------|--------|----------|
| Optimistic updates généralisés | Moyenne | 5 jours | Perf | P2 |
| Architecture feature-based | Élevée | 10 jours | Maintenabilité | P2 |
| Export PDF rapport | Moyenne | 3 jours | Produit | P2 |
| Tests intégration (MSW + Vitest) | Moyenne | 5 jours | Qualité | P2 |
| Recherche globale | Moyenne | 3 jours | UX | P2 |
| Multi-langue (i18n) | Moyenne | 4 jours | Marché | P2 |

### PHASE 4 — Scalabilité (4-8 mois)

| Tâche | Difficulté | Temps estimé | Impact | Priorité |
|-------|-----------|-------------|--------|----------|
| Tests E2E Playwright | Élevée | 2 semaines | Qualité | P3 |
| Backend Edge Functions Supabase | Élevée | 3 semaines | Scalabilité | P3 |
| Module facturation | Élevée | 4 semaines | Business | P3 |
| Application mobile Capacitor | Élevée | 6 semaines | Distribution | P3 |
| Calcul conflits côté Postgres | Moyenne | 1 semaine | Perf + Sécurité | P3 |

---

## 19. AUDIT FINAL

| Dimension | Note | Justification |
|-----------|------|---------------|
| **Architecture** | **5.5 / 10** | Store monolithique, pas de séparation features, mais BDD bien conçue |
| **Sécurité** | **5 / 10** | Fallback user_metadata, RLS Storage non auditable, validation absente |
| **Performances** | **6 / 10** | Bonnes pratiques front (lazy, compress), mais fetchMissions sans pagination |
| **UX** | **8 / 10** | Portail technicien excellent, admin fonctionnel, quelques lacunes (confirm dialogs) |
| **UI** | **8 / 10** | Design technicien premium, admin cohérent, contrastes à corriger |
| **Qualité du code** | **6 / 10** | Bonne lisibilité, mais composants géants, any types, duplication |
| **Évolutivité** | **5.5 / 10** | BDD extensible, front trop couplé au store monolithique |
| **Maintenabilité** | **5 / 10** | Zéro test, fichiers géants, pas de CI/CD |

### **Note globale : 58 / 100**

---

### Verdict final

> **NeuroEvent est un MVP avancé, proche d'un produit « presque prêt ».**

L'application démontre un niveau technique réel et une vision produit claire, avec des fonctionnalités terrain (portail technicien) d'une qualité comparable à des applications consumer professionnelles. C'est un travail sérieux, non un simple prototype.

Cependant, plusieurs blockers techniques et sécuritaires empêchent un déploiement commercial sans risque :

- L'anti-pattern de sérialisation des métadonnées dans `required_skills[]` est une **bombe à retardement** qui peut corrompre des données de production lors d'une migration ou d'un bug de parsing.
- L'**absence totale de tests** signifie que chaque déploiement est un saut dans le vide.
- La **validation des formulaires côté client** est absente, ouvrant la porte à des données invalides en base.
- Les **politiques RLS Storage** sont probablement insuffisantes pour protéger les assets sensibles (signatures, photos).

Avec 4 à 6 semaines de travail focalisé sur la Phase 1 de la roadmap proposée, l'application atteindrait le seuil de confiance nécessaire à un lancement en production commerciale pour des équipes de 5 à 50 personnes.

---

*Audit produit par Claude Sonnet 4.6 — Juin 2026*
