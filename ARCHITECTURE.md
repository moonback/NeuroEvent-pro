# Architecture — NeuroEvent

> Dernière mise à jour : reflète l'état du code à la racine du dépôt (`main`).
> ⚠️ À compléter : ajouter un diagramme d'infrastructure cloud (Vercel / Supabase) si le projet est déployé.

---

## Vue d'ensemble

```mermaid
flowchart LR
    subgraph Client["Navigateur / PWA"]
        A[React 19 UI]
        Z[Zustand Store]
    end

    subgraph Backend["Supabase"]
        B[PostgreSQL\n(tables + RLS)"]
        C[Auth\n(email/password)"]
        D[Realtime\n(WebSocket)"]
        E[Storage\n(signatures, photos)"]
    end

    A -->|REST / Auth| C
    A -->|REST| B
    A -->|WebSocket| D
    A -->|Upload fichiers| E
    A <-->|State| Z
    D -->|postgres_changes| Z
```

**Flux de données :**

1. L'utilisateur s'authentifie via `supabase.auth.signInWithPassword()` → JWT stocké côté client.
2. `useStore.initialize()` charge toutes les entités en parallèle (`Promise.all`) au chargement.
3. Chaque mutation (ajout / modification / suppression) appelle Supabase, puis `get().initialize()` qui fait un re-fetch global (actuellement — voir point d'amélioration en P0).
4. Le canal Realtime `public_db_changes` écoute tous les changements en base ; un debounce de 400 ms déclenche un re-fetch ciblé.
5. Les pointages de matériel utilisent une **mise à jour optimiste** : le store est mis à jour immédiatement, Supabase est appelé en arrière-plan. En mode offline, l'action est mise en queue (`syncQueue`) et resynchronisée au retour en ligne.

---

## Frontend

### Structure des composants

```
src/
├── components/
│   ├── layout/          # Sidebar + Header Admin
│   ├── ui/              # Modal, Toaster, Avatar, ImageLightbox, etc.
│   ├── *.tsx            # Modales de création / édition (Mission, Technician, etc.)
│   └── *.tsx            # Composants métier (QRScannerModal, SignaturePad, etc.)
└── pages/               # 16 pages, chargées en lazy (code-splitting)
```

### Routing et RBAC

`App.tsx` est le point unique de décision :

```
session présent ?
  ├─ role = 'Admin'  → Layout (Sidebar) + Routes Admin (Planning, Technicians, …)
  └─ role = 'Technicien' → TechnicianDashboard + Settings uniquement

session absent → /login
```

Le rôle est **résolu côté serveur** (table `profiles`), jamais uniquement depuis `user_metadata` (modifiable côté client). Ce principe est implémenté dans `store/auth.ts:resolveRole()`.

### Gestion d'état

**Un seul store Zustand** (`store/index.ts`) persisté en localStorage (`eventplanner-storage`). Il contient :

| Clé | Type | Description |
|-----|------|-------------|
| `missions` | `Mission[]` | Missions enrichies (skills parsés, équipements, photo URLs) |
| `technicians` | `Technician[]` | Dont `skills`, `driverLicense`, `avatarUrl` |
| `trucks` | `Truck[]` | |
| `equipment` | `Equipment[]` | |
| `clients` | `Client[]` | |
| `timeLogs` | `TimeLog[]` | Logs de travail par mission |
| `dayLogs` | `TechnicianDayLog[]` | Résumé journalier par technicien |
| `unavailabilities` | `TechnicianUnavailability[]` | |
| `missionPhotos` | `MissionPhoto[]` | |
| `syncQueue` | `SyncQueueItem[]` | Queue offline pour les pointages |
| `loading` | `boolean` | |

**Anti-pattern évité** : il n'y a pas de `any` dans les types du store. `src/types/database.ts` définit manuellement toutes les lignes Supabase avec `Row / Insert / Update`.

**Pattern des mutations** : toutes les fonctions du store retournent après un premier `set()` optimiste (quand applicable) puis appellent `supabase.*().select()` ou `.eq()` pour persister. Aucune erreur Supabase n'est silencieuse — `reportError()` affiche un toast.

### Code-splitting

Les pages FullCalendar, Recharts et `html5-qrcode` sont chargées en **lazy loading** via `React.lazy()` pour ne pas pénaliser le premier chargement.

### PWA

`vite-plugin-pwa` génère un service worker Workbox qui met en cache les assets statiques. Le cache des requêtes Supabase est **intentionnellement désactivé** (`runtimeCaching: []`) pour éviter des boucles de refetch — la synchronisation passe par Realtime.

---

## Backend / API

Il n'y a **pas de serveur Node.js custom** en production. L'API est 100 % Supabase :

| Opération | Mécanisme |
|-----------|-----------|
| Authentification | `supabase.auth.signInWithPassword / signUp` |
| Lecture | REST auto-généré par PostgREST (`supabase.from('table').select()`) |
| Écriture | REST via PostgREST (`supabase.from('table').insert / update / delete`) |
| Fichiers | `supabase.storage.from('bucket').upload / remove / getPublicUrl` |
| Temps réel | Canal Postgres Changes `supabase.channel('public_db_changes')` |

Le serveur Express présent dans `package.json` (`"express": "^4.21.2"`) n'est **pas utilisé** — il pourrait servir au pré-rendu SSR ou à un proxy AI Studio, mais n'est pas nécessaire au fonctionnement de l'application.

### Authentification

- **Méthode** : email + mot de passe (Supabase Auth).
- **Session** : JWT stocké en mémoire par `@supabase/supabase-js`, rafraîchi automatiquement.
- **Rôle** : résolu via `profiles.role` en base (serveur), pas via `user_metadata` (client). Un trigger SQL empêche l'auto-promotion au rôle Admin.
- **Inscription** : crée un compte `Technicien` par défaut ; la promotion Admin se fait manuellement en base.

### Middlewares / Sécurité

- **RLS (Row-Level Security)** : activé sur toutes les tables. Les politiques actuelles sont **permissives** (`true` pour tous) — voir P0 Roadmap (durcir les RLS).
- **Storage** : buckets `signatures` et `mission-photos` en lecture publique, écriture authentifiée.

---

## Base de données

### Modèle relationnel simplifié

```
┌─────────────┐       ┌──────────────────────┐       ┌─────────────┐
│  profiles   │       │       missions        │       │   clients   │
│ id (PK, FK) │       │ id (PK)               │       │ id (PK)     │
│ email       │       │ title                 │◄──────│ name        │
│ first_name  │       │ type                  │       │ contact_*   │
│ last_name   │       │ client (text)         │       │ address     │
│ role        │       │ client_id (FK)        │       │ notes       │
└─────────────┘       │ address               │       └─────────────┘
                      │ start_date / end_date │
┌─────────────┐       │ truck_id (FK)         │       ┌─────────────┐
│ technicians │       │ status                │       │    trucks   │
│ id (PK)     │◄──────│ color                 │       │ id (PK)     │
│ first_name  │       │ signature_url         │       │ name        │
│ last_name   │       └──────────┬────────────┘       │ plate       │
│ specialty   │                  │                    │ volume      │
│ color       │       ┌──────────┴───────────┐       └─────────────┘
│ skills[]    │       │                      │
│ driver_license │    ▼                      ▼
└─────────────┘  mission_technicians    mission_equipments
                      (PK: mission+tech)    (PK: mission+equip)
┌──────────────────────────┐                    ┌─────────────┐
│ technician_unavailabilities│                │ equipments  │
│ id (PK)                    │                │ id (PK)     │
│ technician_id (FK)         │                │ name        │
│ start_date / end_date       │                │ category    │
│ type (Congé/Indispo)        │                │ total_qty   │
└──────────────────────────┘                  └─────────────┘

┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐
│ mission_time_logs │  │ mission_photos      │  │ technician_day_logs│
│ id (PK)           │  │ id (PK)             │  │ id (PK)            │
│ mission_id (FK)   │  │ mission_id (FK)    │  │ technician_id (FK)│
│ technician_id(FK)│  │ type (before/after)│  │ date              │
│ start/end_time    │  │ url                 │  │ first_mission_start│
│ note              │  │ file_path           │  │ day_end_time      │
└───────────────────┘  │ uploaded_by (FK)    │  │ total_minutes    │
                      └────────────────────┘  └───────────────────┘
```

### Stratégie de migration

- `supabase_schema.sql` : schéma initial (tables, enums, RLS, grants, storage buckets).
- Migrations successives dans `supabase/migrations/` : colonnes ajoutées (`checked`, `signature_url`, `driver_license`, etc.).
- Toutes les migrations sont **idempotentes** (`CREATE TYPE IF NOT EXISTS`, `DO $$ BEGIN/EXCEPTION`).
- `NOTIFY pgrst, 'reload schema'` recharge le cache PostgREST après chaque ALTER.

### Enumérations PostgreSQL

```sql
equipment_category : ('Arcade', 'Sonorisation', 'Éclairage', 'Scène', 'Décoration', 'Autre')
mission_status     : ('Planifiée', 'En cours', 'Terminée')
mission_type       : ('Livraison', 'Montage', 'Démontage', 'Événement complet')
user_role          : ('Admin', 'Technicien')
unavailability_type : ('Congé', 'Indisponibilité')
```

---

## Services externes

| Service | Rôle | Détails |
|---------|------|---------|
| **Supabase Cloud** | Database, Auth, Realtime, Storage | Projet `eventplanner-pro` — URL et anon key en variables d'environnement |
| **Vercel** | Hébergement frontend | `vercel.json` avec rewrites SPA (`/→/index.html`) |
| **Google Maps** | Lien itinéraire sur les missions | URL externe : `https://www.google.com/maps/dir/?api=1&destination=<adresse>` |
| **Gemini API** | ⚠️ Référencée dans `.env.example` mais non utilisée dans le code actuel | `GEMINI_API_KEY` — à vérifier si réellement implémentée |

> ⚠️ À compléter : documenter toute intégration tierce supplémentaires détectée après la création de ce document.

---

## Décisions d'architecture

| Décision | Justification |
|----------|---------------|
| **Client Supabase typé** (`createClient<Database>`) | Élimine tous les `any` dans les appels Supabase ; types写得 à la main dans `database.ts`, compatibles avec `supabase gen types typescript`. |
| **Un seul store Zustand** | Évite la complexité d'un pattern provider/context pour des données qui changent fréquemment ; la persistance intégrée (`persist` middleware) assure le mode offline. |
| **Role résolu côté serveur** | Empêche un client malveillant de se promouvoir Admin via `user_metadata`. La barrière de sécurité est en base (trigger anti-auto-promotion + RLS), pas côté UI. |
| **Re-fetch global après mutation** (`get().initialize()`) | Simple à implémenter et robuste. Limitation connue en P0 : remplacé par des mutations ciblées pour éviter de recharger 7 tables à chaque écriture. |
| **FullCalendar (payant) plutôt que bibliothèque gratuite** | `Resource Timeline` est essentiel pour visualiser camion + techniciens sur la même vue. La licence est incluse dans le bundle. |
| **Skills stockés dans un tableau JSONB (`text[]`)** au lieu d'une table de jointure | Les compétences requises par mission (`required_skills`) et les compétences technicien (`skills`) sont des tableaux simples ; la dénormalisation évite des jointures. Un préfixe `meta:` est utilisé pour stocker les métadonnées de mission (delivery/pickup dates, report, photos legacy) dans le même tableau. |
| **Photos compressées côté client** (`addMissionPhoto`) | Réduit la bande passante et le coût de stockage Supabase. Canvas + JPEG 0.82 + max 1920 px. |
| **Pas de Next.js / SSR** | Application principalement côté client, pas de SEO à adresser. Vite suffit. Le choix de Vercel comme hébergeur ne présume pas d'un framework. |
| **Pas de test unitaire à ce jour** | Roadmap prévoit Vitest + Playwright. Le store est testable unitairement (fonctions pures). |

---

## Points d'attention (dette technique)

| Item | Impact | Action |
|------|--------|--------|
| Re-fetch global après chaque mutation | Performance | Roadmap P0 |
| RLS actuellement permissives | Sécurité | Roadmap P0 |
| Pas de notion de stock disponible vs réservé | Métier | Roadmap P0 |
| `driver_license` en `any` dans la migration | Typage | Vérifier après migration |
| Absence de tests automatisés | Fiabilité | Roadmap transverses |
| Clé Gemini API dans `.env.example` mais non utilisée | Confusion | Nettoyer ou implémenter |