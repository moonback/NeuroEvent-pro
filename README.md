# NeuroEvent — Plateforme de gestion événementielle

> **Application web moderne** pour les agences événementielles qui gèrent des interventions terrain : livraisons, montages, démontages. Elle orchestre missions, techniciens, véhicules et matériel en temps réel entre un portail Admin desktop et un portail Technicien mobile-first.

---

## Pitch

- **Pour qui** : agences événementielles avec équipes terrain (techniciens, chauffeurs) et administrateurs.
- **Problème résolu** : coordination complexe entre missions, double-affectation de techniciens/camions, suivi du matériel, pointage terrain, gestion des livraisons et reprises.
- **Solution** :
  - **Portail Admin** : planning FullCalendar, CRUD complet, stats Recharts, gestion des heures, fiches de mission imprimables.
  - **Portail Technicien mobile-first** : dashboard immersif style "Uber Driver", swipe gestures, pull-to-refresh, drawer mission détaillé, scan QR, pointage matériel, signature tactile, photos terrain.
- **Stack** : React 19 + TypeScript strict + Vite + Tailwind CSS v4 + Zustand + Supabase (PostgreSQL, Auth, Realtime, Storage) + PWA.
- **Valeur ajoutée** : synchronisation temps-réel entre tous les utilisateurs, mode offline pour le terrain, détection de conflits logistiques, gestion des livraisons/reprises indépendantes, PWA installable.

---

## Badges

| Badge | Valeur |
|-------|--------|
| **Build** | `npm run build` — Vite 6 + TypeScript 5.8 |
| **Tests** | `npm run test` — Vitest |
| **Licence** | MIT |
| **Version** | `0.0.0` |

---

## Stack technique

| Technologie | Rôle | Version |
|-------------|------|---------|
| React | UI framework | 19.0.1 |
| TypeScript | Typage statique | 5.8.2 |
| Vite | Build tool / dev server | 6.2.3 |
| Tailwind CSS | Styles | 4.1.14 |
| Zustand | Gestion d'état | 5.0.14 |
| Supabase | Backend-as-a-Service (PostgreSQL, Auth, Realtime, Storage) | — |
| React Router | Routage | 7.17.0 |
| FullCalendar | Calendrier interactif | 6.1.20 |
| Recharts | Graphiques / stats | 3.8.1 |
| html5-qrcode | Scan QR code | 2.3.8 |
| react-qr-code | Génération QR code | 2.2.0 |
| react-signature-canvas | Signature tactile | 1.1.0-alpha.2 |
| Lucide React | Icônes | 0.546.0 |
| date-fns | Manipulation de dates | 4.4.0 |
| Zod | Validation de schémas | 3.25.76 |
| vite-plugin-pwa | Progressive Web App | 1.3.0 |
| Vitest | Tests unitaires | 4.1.9 |

---

## Fonctionnalités principales

### Interface Administrateur

- **Planning interactif** — Calendrier FullCalendar (mois / semaine / jour / resource timeline) avec vue des missions, camions et compétences requises.
- **Kanban** — Vue en colonnes par statut (Planifiée / En cours / Terminée).
- **Gestion des missions** — CRUD complet avec affectation de techniciens, véhicules, matériel. Types : Livraison, Montage, Démontage, Événement complet.
- **Livraison & Reprise** — Dates indépendantes de la mission (livraison peut être la veille, reprise le lendemain), temps d'installation en minutes.
- **Génération de missions fictives** — Bouton "10 events juin" pour générer des événements de test localisés à Paris et IDF (juin 2026) avec livraison/reprise/ temps de montage réalistes.
- **Gestion des techniciens** — Prénom, nom, spécialité, couleur, compétences, permis de conduire (catégories, date d'obtention), avatar.
- **Gestion des indisponibilités** — Congés et indisponibilités par technicien, détectés lors de l'affectation.
- **Gestion des véhicules** — Camions avec nom, immatriculation, volume (m³).
- **Gestion du matériel** — Équipements par catégorie (Arcade, Sonorisation, Éclairage, Scène, Décoration, Autre), import CSV.
- **Gestion des clients** — Fiches complètes avec coordonnées et notes.
- **Gestion des utilisateurs** — Création de comptes, attribution du rôle Admin / Technicien.
- **Détection de conflits** — Avertissement si un technicien ou camion est déjà affecté sur le créneau, ou si le stock matériel est insuffisant.
- **Calcul du stock disponible** — Module pur `lib/stock.ts` : quantité réservée par fenêtre, vue d'ensemble du stock, alertes de pénurie.
- **Fiches de mission** — Récapitulatifs imprimables avec section signature client.
- **QR Codes** — Génération et impression multi-étiquettes pour le matériel.
- **Statistiques** — Tableau de bord analytique (missions par période, top techniciens, taux d'utilisation du matériel).
- **Gestion des heures techniciens** — Suivi des heures par technicien (time logs + day logs).
- **Détails de mission** — Vue complète avec livraison, reprise, temps d'installation, équipements, techniciens, camion, photos terrain.

### Interface Technicien (mobile-first, style "Uber Driver")

- **Dashboard personnel** — Liste des missions assignées (à venir / en cours / terminées) avec swipe entre filtres, pull-to-refresh.
- **Drawer mission détaillé** — Onglets : Général, Client, Équipement, Check-list, Équipe, Heures, Photos, Rapport.
- **Général** — Livraison, reprise, temps d'installation, adresse avec lien Google Maps.
- **Client** — Coordonnées complètes de l'événement.
- **Équipement** — Liste du matériel assigné avec pointage (check/uncheck).
- **Check-list** — Liste de contrôle personnalisable par technicien.
- **Équipe** — Collègues assignés avec avatars.
- **Heures** — Pointage début/fin de mission avec calcul automatique.
- **Photos** — Upload avant/après avec compression JPEG, lightbox pour visualisation.
- **Rapport** — Compte-rendu texte de la mission.
- **Scan QR embarqué** — Pointage instantané du matériel scanné via `html5-qrcode`.
- **Signature tactile** — Canvas de signature pour le bon de livraison, stockage Supabase Storage.
- **Photos terrain** — Upload de photos avant/après avec compression côté client et stockage dans Supabase Storage.
- **Profil et paramètres** — Modification du nom, téléphone, langue, notifications, avatar, déconnexion.
- **Mode PWA / offline** — Service worker Workbox, queue de synchro (`syncQueue`) pour les pointages hors ligne.
- **Gestion des heures personnelles** — Vue récapitulative de ses propres pointages.

### Sécurité & Infrastructure

- **Authentification** — Email/password via Supabase Auth, inscription automatique Technicien.
- **RLS durcies** — Row-Level Security sur toutes les tables : techniciens ne voient que leurs missions, modifications limitées aux champs autorisés.
- **RBAC** — Routage différencié Admin vs Technicien via résolution du rôle côté serveur (table `profiles`).
- **Realtime** — Canal `postgres_changes` avec debounce 400 ms pour la synchronisation live.
- **Persistance locale** — Zustand `persist` middleware (`localStorage`) pour le cache offline.
- **Mode sombre immersif** — Thème Uber Driver pour le portail Technician (couleurs vives, haut contraste).
- **PWA installable** — `vite-plugin-pwa`, manifest avec icônes, support offline.
- **Tests unitaires** — Vitest pour les modules purs (`lib/conflicts.ts`, `lib/stock.ts`).
- **100% TypeScript** — 0 `any`, types manuels pour Supabase (`src/types/database.ts`).
- **Code-splitting** — Lazy loading par route (FullCalendar, Recharts, html5-qrcode chargés à la demande).

---

## Prérequis

| Prérequis | Version minimale |
|-----------|-----------------|
| Node.js | 18+ |
| npm | 9+ |
| Compte Supabase | Cloud ou Local |

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/<username>/eventplanner-pro.git
cd eventplanner-pro

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env.local
cp .env.example .env.local

# 4. Renseigner les variables Supabase
# Supabase Dashboard → Settings → API → Récupérer les valeurs
```

---

## Configuration

Toutes les variables d'environnement (fichier `.env.local`) :

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `VITE_SUPABASE_URL` | URL publique du projet Supabase | `https://xyz.supabase.co` | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon | `eyJhbG...VCJ9...` | ✅ |
| `APP_URL` | URL de déploiement (OAuth callbacks) | `https://monapp.vercel.app` | ⬜ |
| `DISABLE_HMR` | Désactiver le Hot Module Replacement | `true` | ⬜ |

---

## Lancement

```bash
# Développement (http://localhost:3000)
npm run dev

# Build de production → /dist
npm run build

# Aperçu production
npm run preview

# Vérification TypeScript (tsc --noEmit)
npm run lint

# Tests unitaires (Vitest)
npm run test
```

---

## Structure du projet

```
eventplanner-pro/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout principal Admin (sidebar, header)
│   │   ├── ui/              # Composants réutilisables (Modal, Toaster, Avatar, Lightbox, etc.)
│   │   ├── technician/      # Composants spécifiques portail Technicien (Drawer, Tabs, FAB, etc.)
│   │   ├── ClientModal.tsx, EquipmentModal.tsx, MissionModal.tsx, TruckModal.tsx, TechnicianModal.tsx
│   │   ├── CSVImportModal.tsx, QRCodePrintModal.tsx, QRScannerModal.tsx, SignaturePad.tsx
│   │   ├── TechnicianHoursAdmin.tsx, TechnicianMyHours.tsx, TechnicianUnavailabilities.tsx, TimeLogPanel.tsx
│   │   └── ...
│   ├── hooks/               # useFullscreen, useMediaQuery, useSwipeGestures
│   ├── lib/
│   │   ├── avatar.ts        # Génération avatar (initiales / Gravatar)
│   │   ├── conflicts.ts     # Détection de conflits logistiques
│   │   ├── stock.ts         # Calcul du stock disponible et réservé
│   │   ├── constants.ts     # Catalogue des compétences (SKILL_CATALOG)
│   │   ├── supabase.ts      # Client Supabase typé Database
│   │   ├── time.ts          # Helpers de calcul d'heures
│   │   └── validations.ts   # Schémas Zod (mission, technicien, client, etc.)
│   ├── pages/
│   │   ├── Auth.tsx, Settings.tsx
│   │   ├── Admin : Planning.tsx, Kanban.tsx, MissionList.tsx, MissionDetail.tsx, MissionBriefs.tsx
│   │   ├── Admin : Technicians.tsx, Trucks.tsx, Equipment.tsx, Clients.tsx, Users.tsx, Disponibilites.tsx
│   │   ├── Admin : Stats.tsx, TechnicianHours.tsx
│   │   └── Tech : TechnicianDashboard.tsx
│   ├── store/
│   │   ├── index.ts         # Store Zustand principal (CRUD + realtime)
│   │   ├── auth.ts          # Session, résolution du rôle serveur
│   │   └── toast.ts         # Notifications toast
│   ├── types/
│   │   ├── index.ts         # Types métier (Mission, Technician, etc.)
│   │   └── database.ts      # Types ligne Supabase (Database public.Tables)
│   ├── App.tsx              # Routeur + RBAC (Admin vs Technicien) + lazy loading
│   └── main.tsx             # Point d'entrée React
├── supabase/
│   └── migrations/           # Migrations SQL (RLS, nouvelles colonnes, triggers)
├── .env.example              # Template des variables d'environnement
├── .env.local                # ⚠️ Ne pas commiter (gitignore)
├── package.json
├── tsconfig.json
├── vite.config.ts            # Vite + Tailwind v4 + PWA
├── vercel.json               # Rewrites SPA pour Vercel
├── ARCHITECTURE.md           # Architecture technique détaillée
├── CONTRIBUTING.md           # Guide de contribution
├── ROADMAP.md                # Roadmap projet
└── README.md
```

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet : workflow Git, standards de code, processus de review.

---

## Licence

MIT
