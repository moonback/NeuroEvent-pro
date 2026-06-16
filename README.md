# NeuroEvent — Plateforme de gestion événementielle

> **Application web moderne** pour les agences événementielles qui gèrent des interventions terrain : livraisons, montages, démontages. Elle orchestre missions, techniciens, véhicules et matériel en temps réel.

---

## Pitch

- **Pour qui** : agences événementielles avec équipes terrain (techniciens, chauffeurs) et administrateurs.
- **Problème résolu** : coordination complexe entre missions, double-affectation de techniciens/camions, suivi du matériel, pointage terrain.
- **Solution** : un portail Admin (planning FullCalendar, CRUD complet, stats Recharts) + un portail Technicien mobile-first (dashboard, scan QR, pointage matériel, signature tactile).
- **Stack** : React 19 + TypeScript strict + Vite + Tailwind CSS v4 + Zustand + Supabase (PostgreSQL, Auth, Realtime, Storage) + PWA.
- **Valeur ajoutée** : synchronisation temps-réel entre tous les utilisateurs, mode offline pour le terrain, détection de conflits logistiques, PWA installable.

---

## Badges

| Badge | Valeur |
|-------|--------|
| **Build** | `npm run build` — Vite 6 + TypeScript 5.8 |
| **Licence** | MIT |
| **Version** | `0.0.0` |

---

## Stack technique

| Technologie | Rôle | Version détectée |
|-------------|------|------------------|
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
| vite-plugin-pwa | Progressive Web App | 1.3.0 |

---

## Fonctionnalités principales

### Interface Administrateur

- **Planning interactif** — Calendrier FullCalendar (mois / semaine / jour / resource timeline) avec vue des missions, camions et compétences requises.
- **Kanban** — Vue en colonnes par statut (Planifiée / En cours / Terminée).
- **Gestion des missions** — CRUD complet avec affectation de techniciens, véhicules, matériel ; types : Livraison, Montage, Démontage, Événement complet.
- **Gestion des techniciens** — Prénom, nom, spécialité, couleur, compétences, permis de conduire, avatar.
- **Gestion des indisponibilités** — Congés et indisponibilités par technicien, détectés lors de l'affectation.
- **Gestion des véhicules** — Camions avec nom, immatriculation, volume (m³).
- **Gestion du matériel** — Équipements par catégorie (Arcade, Sonorisation, Éclairage, Scène, Décoration, Autre), import CSV.
- **Gestion des clients** — Fiches complètes avec coordonnées et notes.
- **Gestion des utilisateurs** — Création de comptes, attribution du rôle Admin / Technicien.
- **Détection de conflits** — Avertissement si un technicien ou camion est déjà affecté sur le créneau, ou si le stock matériel est insuffisant.
- **Fiches de mission** — Récapitulatifs imprimables avec section signature client.
- **QR Codes** — Génération et impression multi-étiquettes pour le matériel.
- **Statistiques** — Tableau de bord analytique (missions par période, top techniciens, taux d'utilisation du matériel).
- **Gestion des heures techniciens** — Suivi des heures par technicien admin (time logs + day logs).

### Interface Technicien (mobile-first)

- **Dashboard personnel** — Liste des missions assignées (à venir / en cours / terminées).
- **Détail mission** — Adresse avec lien Google Maps, collègues assignés, camion, check-list du matériel.
- **Scan QR embarqué** — Pointage instantané du matériel scanné via `html5-qrcode`.
- **Signature tactile** — Canvas de signature pour le bon de livraison, verrouillé après validation.
- **Photos terrain** — Upload de photos avant/après avec compression côté client et stockage dans Supabase Storage.
- **Profil et paramètres** — Modification du nom, avatar, déconnexion.

---

## Prérequis

| Prérequis | Version minimale |
|-----------|-----------------|
| Node.js | 18+ |
| npm | 9+ |
| Compte Supabase | Cloud ou Local |

> ⚠️ À compléter : ajouter les comptes de service tiers requis (Gemini API key si utilisé dans le projet).

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
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `GEMINI_API_KEY` | Clé API Gemini (AI Studio) | `AIza...` | ⬜ (si utilisé) |
| `APP_URL` | URL de déploiement (OAuth callbacks) | `https://monapp.vercel.app` | ⬜ |
| `DISABLE_HMR` | Désactiver le Hot Module Replacement (AI Studio) | `true` | ⬜ |

> ⚠️ À compléter : documenter toute variable `VITE_*` ou secret ajouté après la création de `.env.example`.

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
```

---

## Structure du projet

```
eventplanner-pro/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout principal Admin (sidebar, header)
│   │   ├── ui/              # Composants réutilisables (Modal, Toaster, Avatar, etc.)
│   │   ├── ClientModal.tsx
│   │   ├── CSVImportModal.tsx
│   │   ├── EquipmentModal.tsx
│   │   ├── EquipmentTable.tsx
│   │   ├── MissionModal.tsx
│   │   ├── QRCodePrintModal.tsx
│   │   ├── QRScannerModal.tsx
│   │   ├── SignaturePad.tsx
│   │   ├── TechnicianHoursAdmin.tsx
│   │   ├── TechnicianModal.tsx
│   │   ├── TechnicianMyHours.tsx
│   │   ├── TechnicianUnavailabilities.tsx
│   │   ├── TimeLogPanel.tsx
│   │   └── TruckModal.tsx
│   ├── hooks/
│   │   ├── useFullscreen.ts
│   │   ├── useMediaQuery.ts
│   │   └── useSwipeGestures.ts
│   ├── lib/
│   │   ├── avatar.ts        # Génération avatar (initiales / Gravatar)
│   │   ├── conflicts.ts     # Détection de conflits logistiques
│   │   ├── constants.ts     # Catalogue des compétences (SKILL_CATALOG)
│   │   ├── supabase.ts     # Client Supabase typé Database
│   │   └── utils.ts         # Helpers (cn via clsx)
│   ├── pages/
│   │   ├── Auth.tsx                 # Login / Inscription
│   │   ├── Clients.tsx              # Gestion clients
│   │   ├── Disponibilites.tsx       # Gestion indisponibilités
│   │   ├── Equipment.tsx             # Gestion matériel
│   │   ├── Kanban.tsx               # Vue kanban missions
│   │   ├── MissionBriefs.tsx       # Fiches de mission imprimables
│   │   ├── MissionDetail.tsx        # Détail d'une mission
│   │   ├── MissionList.tsx          # Liste des missions
│   │   ├── Planning.tsx             # Calendrier FullCalendar
│   │   ├── Settings.tsx             # Paramètres / Profil
│   │   ├── Stats.tsx                # Tableau de bord analytique
│   │   ├── TechnicianDashboard.tsx # Dashboard mobile Technician
│   │   ├── TechnicianHours.tsx      # Suivi des heures Technician
│   │   ├── Technicians.tsx          # Gestion techniciens
│   │   ├── Trucks.tsx               # Gestion véhicules
│   │   └── Users.tsx                # Gestion utilisateurs
│   ├── store/
│   │   ├── index.ts          # Store Zustand principal (missions, techs, trucks, etc.)
│   │   ├── auth.ts           # Session, résolution du rôle serveur
│   │   └── toast.ts          # Notifications toast
│   ├── types/
│   │   ├── index.ts          # Types métier (Mission, Technician, etc.)
│   │   └── database.ts       # Types ligne Supabase (Database public.Tables)
│   ├── App.tsx               # Routeur + RBAC (Admin vs Technicien)
│   └── main.tsx              # Point d'entrée React
├── supabase/
│   └── migrations/           # Migrations SQL (sécurité, nouvelles colonnes, triggers)
│       ├── 20260610000000_audit_security_and_features.sql
│       ├── 20260611115500_add_technician_skills_and_license.sql
│       ├── 20260611122200_add_mission_time_logs.sql
│       ├── 20260611130000_add_mission_photos.sql
│       ├── 20260616130000_add_profile_phone_and_admin_preferences.sql
│       ├── 20260616140000_add_avatars_bucket_and_avatar_url.sql
│       ├── 20260616150000_add_avatar_url_to_technicians.sql
│       └── 20260617_technician_day_logs.sql
├── .env.example              # Template des variables d'environnement
├── .env.local                # ⚠️ Ne pas commiter (gitignore)
├── package.json
├── tsconfig.json
├── vite.config.ts            # Vite + Tailwind v4 + PWA
├── vercel.json               # Rewrites SPA pour Vercel
└── README.md
```

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet : workflow Git, standards de code, processus de review.

---

## Licence

MIT

> ⚠️ À compléter : le fichier `LICENSE` n'a pas été détecté dans le dépôt. Créer un fichier `LICENSE` contenant le texte de la licence MIT si nécessaire.