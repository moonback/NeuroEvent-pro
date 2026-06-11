# 🎯 NeuroEventPlanning Pro

> **Plateforme professionnelle de gestion d'événements** pour orchestrer vos missions, techniciens, véhicules et matériel en temps réel.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [Roadmap](#-roadmap)
- [Sécurité](#-sécurité)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎬 À Propos

**NeuroEventPlanning Pro** est une application web moderne conçue pour les **agences événementielles** qui gèrent des interventions sur le terrain : livraisons, montages, démontages d'événements.

### Problématique résolue

Les agences événementielles jonglent avec :
- Des missions complexes nécessitant coordination entre plusieurs techniciens
- Une flotte de véhicules à optimiser
- Un parc matériel technique (sonorisation, éclairage, scène, arcade, etc.) à suivre
- Des risques de conflits logistiques (double réservation, matériel manquant)

**EventFlow** centralise tout cela dans une interface intuitive avec synchronisation temps-réel.

### Caractéristiques principales

✅ **Planning interactif** avec calendrier drag & drop  
✅ **Détection automatique** des conflits logistiques  
✅ **Interface mobile optimisée** pour les techniciens sur le terrain  
✅ **Scan QR Code** pour le pointage matériel  
✅ **Synchronisation temps-réel** entre tous les utilisateurs  
✅ **Gestion de rôles** (Admin / Technicien) avec RLS Supabase  
✅ **Fiches de mission** imprimables avec signature client  
✅ **Statistiques & Analytics** pour le suivi d'activité  

---

## ✨ Fonctionnalités

### 🖥️ Interface Administrateur

#### Planning & Missions
- **Calendrier interactif** (FullCalendar) : vues mois, semaine, jour
- **Création de missions** par clic ou drag & drop
- **Types de missions** : Livraison, Montage, Démontage, Événement complet
- **Affectation** de techniciens, véhicules et matériel par mission
- **Détection de conflits** en temps réel :
  - Technicien déjà affecté sur une autre mission
  - Camion réservé sur un créneau identique
  - Matériel insuffisant (stock épuisé)
- **Codes couleur** personnalisables par mission
- **Statuts** : Planifiée, En cours, Terminée

#### Gestion du Parc
- **Techniciens** : prénom, nom, spécialité, couleur d'identification
- **Véhicules** : nom, immatriculation, volume (m³)
- **Matériel** : nom, catégorie (Arcade, Sonorisation, Éclairage, Scène, Décoration, Autre), quantité totale
- **Clients** : fiche complète (coordonnées, adresse, notes)

#### Outils
- **QR Codes** : génération et impression d'étiquettes multi-colonnes pour le matériel
- **Fiches de mission** : récapitulatif imprimable avec emplacement signature client
- **Statistiques** : tableaux de bord analytiques (Recharts)
  - Nombre de missions par période
  - Top techniciens
  - Taux d'utilisation du matériel
- **Gestion des utilisateurs** : création de comptes, attribution de rôles

### 📱 Interface Technicien (Mobile-First)

#### Dashboard Personnel
- **Mes missions** : vue filtrée (à venir / en cours / terminées)
- **Détails mission** :
  - Date, heure, adresse (lien Google Maps)
  - Collègues affectés
  - Camion assigné
  - Liste du matériel requis
- **Actions** :
  - Démarrer la mission
  - Terminer la mission
  - Pointer le matériel (check-list interactive)

#### Scan QR Code
- **Scanner embarqué** (html5-qrcode)
- **Pointage instantané** du matériel scanné
- **Feedback visuel** : matériel coché persiste en base
- **Mise à jour optimiste** : réactivité immédiate même en cas de latence réseau

#### Profil & Paramètres
- Modification prénom / nom
- Déconnexion

---

## 🛠️ Stack Technique

| Domaine | Technologies |
|---------|-------------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **State Management** | Zustand 5 (store unique, synchronisation Realtime) |
| **Backend & BDD** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **Authentification** | Supabase Auth (email/password, RLS natif) |
| **UI/UX** | Tailwind CSS v4 (thème custom "Professional Polish") |
| **Calendrier** | FullCalendar 6 (Daygrid, Timegrid, Resource Timeline) |
| **Graphiques** | Recharts 3 |
| **QR Code** | html5-qrcode (scan), react-qr-code (génération) |
| **Icônes** | Lucide React |
| **Routage** | React Router 7 |
| **Utilitaires** | date-fns 4, clsx, tailwind-merge |

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ et **npm** (ou yarn/pnpm)
- Un compte **Supabase** (gratuit sur [supabase.com](https://supabase.com))

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/eventplanner-pro.git
cd eventplanner-pro
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier `.env.local`

Copiez `.env.example` et renseignez vos identifiants Supabase :

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_publique_anon
```

> **Note** : ces clés sont disponibles dans **Supabase Dashboard → Settings → API**.

---

## ⚙️ Configuration

### Base de données Supabase

#### 1. Créer le schéma initial

Ouvrez **SQL Editor** dans votre projet Supabase et exécutez :

```bash
supabase_schema.sql
```

Puis la migration de sécurité complète :

```bash
supabase/migrations/20260610000000_audit_security_and_features.sql
```

> Ce script est **idempotent** (peut être rejoué sans danger).

#### 2. Créer votre premier compte Admin

Après exécution de la migration, promouvoir un utilisateur :

```sql
update public.profiles set role = 'Admin' where email = 'votre@email.com';
```

#### 3. Activer Realtime

Dans **Database → Replication**, activez les tables :

- `profiles`
- `technicians`
- `trucks`
- `equipments`
- `clients`
- `missions`
- `mission_technicians`
- `mission_equipments`

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL publique du projet Supabase | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 💻 Utilisation

### Démarrage en développement

```bash
npm run dev
```

Ouvre l'application sur **http://localhost:3000**

### Build de production

```bash
npm run build
```

Les fichiers optimisés sont générés dans `/dist`.

### Aperçu de production

```bash
npm run preview
```

### Lint TypeScript

```bash
npm run lint
```

---

## 📂 Architecture

### Structure des dossiers

```
eventplanner-pro/
├── src/
│   ├── components/         # Composants UI
│   │   ├── layout/         # Layout principal (Admin)
│   │   ├── ui/             # Composants réutilisables (Modal, Toaster)
│   │   ├── ClientModal.tsx
│   │   ├── EquipmentModal.tsx
│   │   ├── MissionModal.tsx
│   │   ├── QRCodePrintModal.tsx
│   │   ├── QRScannerModal.tsx
│   │   ├── TechnicianModal.tsx
│   │   └── TruckModal.tsx
│   ├── hooks/              # Hooks custom (useMediaQuery)
│   ├── lib/                # Utilitaires
│   │   ├── supabase.ts     # Client Supabase typé
│   │   ├── conflicts.ts    # Détection conflits logistiques
│   │   └── utils.ts        # Helpers (cn)
│   ├── pages/              # Pages principales
│   │   ├── Auth.tsx        # Authentification
│   │   ├── Planning.tsx    # Calendrier Admin
│   │   ├── TechnicianDashboard.tsx  # Dashboard mobile Technicien
│   │   ├── Technicians.tsx
│   │   ├── Trucks.tsx
│   │   ├── Equipment.tsx
│   │   ├── Clients.tsx
│   │   ├── Users.tsx
│   │   ├── MissionBriefs.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── store/              # État global (Zustand)
│   │   ├── index.ts        # Store principal (missions, techniciens, etc.)
│   │   ├── auth.ts         # Authentification (session, rôle)
│   │   └── toast.ts        # Notifications
│   ├── types/              # Types TypeScript
│   │   ├── index.ts        # Types métier (Mission, Technician, etc.)
│   │   └── database.ts     # Types base Supabase
│   ├── App.tsx             # Routeur principal (RBAC)
│   ├── main.tsx            # Point d'entrée
│   └── index.css           # Styles Tailwind
├── supabase/
│   └── migrations/         # Migrations SQL
├── .env.example            # Template variables d'environnement
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Flux de données

```
┌─────────────┐
│   Supabase  │  (PostgreSQL + Realtime)
└──────┬──────┘
       │
       │ WebSocket (Realtime)
       │
┌──────▼──────┐
│   Zustand   │  (Store unique, debounce 400ms)
└──────┬──────┘
       │
┌──────▼──────┐
│  React 19   │  (UI Components)
└─────────────┘
```

- **Mutations** : `store.addMission()` → INSERT Supabase → `get().initialize()`
- **Synchronisation** : événement Realtime → debounce → `initialize()` (re-fetch)
- **Optimistic UI** : `toggleEquipmentCheck` met à jour le store immédiatement, puis appelle Supabase

### Modèle de données (ERD simplifié)

```
profiles (Auth)
   ├─ id (UUID, ref auth.users)
   ├─ email
   ├─ first_name, last_name
   └─ role (Admin / Technicien)

technicians
   ├─ id (UUID)
   ├─ first_name, last_name
   ├─ specialty
   └─ color

trucks
   ├─ id (UUID)
   ├─ name, plate
   └─ volume (numeric)

equipments
   ├─ id (UUID)
   ├─ name
   ├─ category (enum)
   └─ total_quantity (int)

clients
   ├─ id (UUID)
   ├─ name
   └─ contact_name, email, phone, address, notes

missions
   ├─ id (UUID)
   ├─ title, type (enum), status (enum)
   ├─ client (text), client_id (FK clients)
   ├─ address
   ├─ start_date, end_date
   ├─ truck_id (FK trucks)
   └─ color

mission_technicians (jointure)
   ├─ mission_id (FK missions)
   └─ technician_id (FK technicians)

mission_equipments (jointure)
   ├─ mission_id (FK missions)
   ├─ equipment_id (FK equipments)
   ├─ quantity (int)
   └─ checked (bool, pointage technicien)
```

---

## 🔮 Roadmap

Voir **[ROADMAP.md](ROADMAP.md)** pour le backlog complet priorisé.

### 🔴 P0 — Fiabilité (en cours)

- ✅ Supprimer les `any` du store (100% typé)
- 🔄 Normaliser le stock matériel (disponibilité réelle vs réservé)
- 🔄 Remplacer le re-fetch global par des mutations ciblées
- 🔄 Durcir les politiques RLS Supabase

### 🟠 P1 — Terrain (forte valeur métier)

- 🎯 **Mode PWA / Offline-first** (cache missions + synchro différée)
- 🎯 **Signature électronique tactile** (canvas pour bon de livraison)
- 🎯 **Cartographie & GPS** (lien Maps, calcul trajet)
- 🎯 **Suivi des pannes** (statut maintenance + upload photo)
- 🎯 **Glisser-déposer enrichi** (drop zones visuelles)

### 🟡 P2 — Confort & Communication

- Notifications push & mini-chat de mission
- Mode sombre (Tailwind dark:)
- Accessibilité (WAI-ARIA, Radix UI)
- Recherche & filtres globaux
- Notifications de conflit proactives

### 🟢 P3 — Croissance

- Multi-agences (SaaS multi-tenant)
- Exports comptables / facturation
- Gestion disponibilités techniciens (congés, compétences)
- Historique & journal d'audit
- Rapports planifiés (Edge Functions + cron)

---

## 🔒 Sécurité

### Row-Level Security (RLS)

Toutes les tables sont protégées par des politiques PostgreSQL RLS :

| Table | Lecture | Écriture |
|-------|---------|----------|
| **profiles** | Soi-même ou Admin | Soi-même ou Admin (rôle protégé par trigger) |
| **missions** | Tous | Admin (création/suppression), Technicien affecté (update statut) |
| **mission_equipments** | Tous | Admin (ajout/suppression), Technicien affecté (pointage `checked`) |
| **technicians, trucks, equipments, clients** | Tous | Admin uniquement |

### Trigger anti auto-promotion

Un trigger `profiles_protect_role` empêche un utilisateur de se promouvoir Admin lui-même.

### Authentification

- Supabase Auth (email/password)
- Session JWT stockée côté client
- Résolution du rôle **serveur** (table `profiles`, pas métadonnées client modifiables)

### Bonnes pratiques

- **Jamais de secrets côté client** : seules les clés `anon` publiques sont exposées
- **Variables d'environnement** : `.env.local` gitignore
- **HTTPS obligatoire** en production (géré par Supabase/Vercel)

---

## 🤝 Contribution

Les contributions sont les bienvenues !

### Workflow

1. **Fork** le dépôt
2. Créer une branche feature : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m 'feat: ajout signature électronique'`
4. Push : `git push origin feature/ma-feature`
5. Ouvrir une **Pull Request**

### Standards

- **TypeScript strict** : pas de `any` (sauf exceptions documentées)
- **Lint** : `npm run lint` doit passer
- **Commits** : convention [Conventional Commits](https://www.conventionalcommits.org/)
- **Tests** : à venir (Vitest + Playwright)

---

## 📄 Licence

**Apache 2.0** — Voir [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Support

- 📧 Email : support@eventflow.app (fictif)
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/eventplanner-pro/issues)
- 📖 Documentation complète : [Wiki](https://github.com/votre-username/eventplanner-pro/wiki) (à venir)

---

## 🎉 Remerciements

Projet développé avec ❤️ pour les professionnels de l'événementiel.

Technologies open-source utilisées :
- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [FullCalendar](https://fullcalendar.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

**NeuroEventPlanning Pro** — *Orchestrez vos événements en toute sérénité* 🚀
