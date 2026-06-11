# NeuroEventPro — Roadmap

Plateforme professionnelle de planification pour agences événementielles : orchestration des missions de terrain, des techniciens, des véhicules et du matériel technique.

> Dernière mise à jour : 11 juin 2026

---

## 🧱 Stack technique

| Domaine | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **État** | Zustand 5 |
| **UI / Styling** | Tailwind CSS v4, Lucide React, `clsx` + `tailwind-merge` |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **Routing** | React Router 7 |
| **Librairies métier** | FullCalendar 6, Recharts 3, html5-qrcode, react-qr-code, date-fns 4 |

---

## ✅ Déjà livré (socle actuel)

Ces fonctionnalités sont **opérationnelles dans le code** et ne sont donc plus dans le backlog.

* **Backend persistant temps-réel** — Supabase (PostgreSQL) connecté à Zustand, avec synchronisation Realtime sur un canal unique (re-fetch débouncé 400 ms).
* **Authentification & rôles (RBAC)** — Supabase Auth avec rôle résolu côté serveur (table `profiles`). Deux interfaces distinctes : **Admin** (planning complet) et **Technicien** (dashboard mobile réduit). Le routage interdit l'accès croisé.
* **Planning interactif** — Calendrier et timeline des missions / camions / matériel (FullCalendar), détection des conflits logistiques.
* **Gestion des entités** — CRUD complet : Missions, Techniciens, Camions, Matériel, Clients, Utilisateurs.
* **Dashboard Technicien mobile** — Vue des missions assignées (colisages, collègues, camion) + **scan QR embarqué** avec pointage du matériel (`toggleEquipmentCheck`, mise à jour optimiste).
* **Parc & QR Codes** — Génération et impression multi-étiquettes des QR codes du matériel.
* **Fiches de mission** — Récapitulatifs imprimables avec visa client.
* **Statistiques** — Tableau de bord analytique (Recharts) : volumétrie, top techniciens, taux de couverture matériel.
* **Feedback utilisateur** — Système de toasts non bloquant ; aucune erreur Supabase n'est silencieuse.
* **Gestion des disponibilités & compétences (Roadmap P3)** — Modale de gestion des indisponibilités techniciens, définition des compétences requises par mission, et assistant d'affectation intelligent avec détection de conflits et suggestion d'affectation automatique.
* **Mode PWA / Offline-first (Roadmap P1)** — Caching local des données de missions, synchronisation des pointages QR différée en tâche de fond dès récupération du réseau, et persistance locale robuste des rapports techniques.
* **Signature électronique tactile (Roadmap P1)** — Intégration d'un panneau de signature électronique tactile (canvas) avec verrouillage de sécurité (une fois signée, la signature ne peut plus être modifiée par le technicien).
* **Refonte & Modernisation UI/UX Portail Technicien (Roadmap P2)** — Refactorisation modulaire (9 composants + 1 hook d'état), thème sombre immersif de type Uber Driver, modale de filtres coulissante compacte pour maximiser l'espace, et pages de sous-onglets adaptées en pleine largeur.

---

## 🗺 Backlog priorisé

Légende effort : 🟢 faible (≤1j) · 🟡 moyen (2–4j) · 🔴 élevé (1 sem+)

### 🔴 P0 — Fiabilité & dette technique (prérequis avant nouvelles features)

Le code montre des fragilités à traiter en priorité avant d'empiler des fonctionnalités.

* [ ] **🟡 Normaliser l'état du parc matériel.** Aujourd'hui `Equipment` ne porte qu'une `totalQuantity` ; il n'existe pas de notion de stock *disponible vs réservé* à une date donnée. Calculer la disponibilité réelle en croisant les missions → empêche le sur-booking de matériel.
* [x] **🟢 Supprimer les `any` du store.** ✅ Fait. Types des lignes Supabase écrits à la main ([src/types/database.ts](src/types/database.ts)), client typé `createClient<Database>`, tous les `any` du store remplacés. A révélé et corrigé un bug latent.
* [ ] **🔴 Remplacer le re-fetch global par des mutations ciblées.** Chaque écriture appelle `get().initialize()` (re-charge **toutes** les tables). Passer à des updates optimistes + invalidation ciblée.
* [ ] **🟡 Politiques RLS Supabase.** Vérifier/durcir les Row-Level Security : un technicien ne doit pouvoir lire/écrire que ses propres missions et pointages côté base (pas seulement côté UI).
* [x] **🟢 Migration SQL `checked` & colonnes.** ✅ Fait. Ajout de la colonne `signature_url` et structuration robuste en base de données.

### 🟠 P1 — Expérience terrain (forte valeur métier)

Ce qui fait gagner du temps aux équipes sur le terrain.

* [x] **🔴 Mode PWA / Offline-first.** ✅ Fait. Caching des missions locales, gestion de la file de synchronisation réseau en tâche de fond.
* [x] **🟡 Signature électronique tactile.** ✅ Fait. Canvas tactile de signature, stockage Supabase, verrouillage après visa.
* [x] **🟢 Cartographie & GPS.** ✅ Fait. Boutons d'itinéraire Maps intégrés aux fiches de mission.
* [ ] **🟡 Suivi des pannes & retours matériel.** Statut « En panne / Maintenance » au retour de mission + upload photo (preuve du dégât) via Supabase Storage. Retirer automatiquement le matériel en panne du stock disponible.
* [ ] **🟢 Glisser-déposer enrichi.** Drop zones visuelles sur le planning, assignation instantanée camion/technicien par drag & drop (FullCalendar `eventDrop` / `resourceTimeline`).

### 🟡 P2 — Confort & communication

* [ ] **🔴 Notifications push & mini-chat de mission.** Messagerie temps-réel par mission (le bureau prévient le camion d'un changement logistique). S'appuie sur Realtime déjà en place + Web Push pour la PWA. Remplace SMS/WhatsApp.
* [x] **🟢 Mode sombre.** ✅ Fait. Refonte thématique noire complète (style Uber Driver) pour le portail Technicien afin de faciliter l'utilisation en soirée/de nuit.
* [ ] **🟡 Accessibilité (WAI-ARIA).** Adopter des primitives headless (Radix/Headless UI) pour les modales et menus → navigation clavier complète.
* [x] **🟢 Recherche & filtres globaux.** ✅ Fait. Implémentation d'une barre de recherche et d'un tiroir de filtres rapides (Missions actives / Historique / Filtres de date).

### 🟢 P3 — Croissance & métier avancé

* [ ] **🔴 Multi-agences (multi-tenant).** Isolation des données par agence (`agency_id` + RLS) pour proposer l'app en SaaS à plusieurs structures.
* [ ] **🟡 Exports comptables / facturation.** Génération de devis et bons de commande à partir des missions ; export PDF/CSV.
* [x] **🟡 Gestion des disponibilités techniciens.** ✅ Fait. Modale absences/congés + définition compétences requises + suggestion intelligente lors de l'affectation sans conflit.
* [ ] **🟢 Historique & journal d'audit.** Traçabilité des modifications de mission (qui a changé quoi, quand).
* [ ] **🟡 Rapports planifiés.** Envoi automatique par e-mail des stats hebdo/mensuelles aux gérants (Supabase Edge Functions + cron).

---

## 🧪 Chantiers transverses (à mener en continu)

* [ ] **Tests** — Mettre en place Vitest (unitaire : store, conflits) + Playwright (parcours critiques : login, création mission, scan QR).
* [ ] **CI/CD** — Pipeline lint + build + tests à chaque PR.
* [ ] **Observabilité** — Capture des erreurs front (Sentry ou équivalent).
* [ ] **Documentation** — Mises à jour des guides d'installation et de déploiement en base.
