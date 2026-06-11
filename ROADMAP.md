# EventFlow Pro — Roadmap

Plateforme professionnelle de planification pour agences événementielles : orchestration des missions de terrain, des techniciens, des véhicules et du matériel technique.

> Dernière mise à jour : 10 juin 2026

---

## 🧱 Stack technique

| Domaine | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6 |
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

---

## 🗺 Backlog priorisé

Légende effort : 🟢 faible (≤1j) · 🟡 moyen (2–4j) · 🔴 élevé (1 sem+)

### 🔴 P0 — Fiabilité & dette technique (prérequis avant nouvelles features)

Le code montre des fragilités à traiter en priorité avant d'empiler des fonctionnalités.

* [ ] **🟡 Normaliser l'état du parc matériel.** Aujourd'hui `Equipment` ne porte qu'une `totalQuantity` ; il n'existe pas de notion de stock *disponible vs réservé* à une date donnée. Calculer la disponibilité réelle en croisant les missions → empêche le sur-booking de matériel.
* [x] **🟢 Supprimer les `any` du store.** ✅ Fait. Types des lignes Supabase écrits à la main ([src/types/database.ts](src/types/database.ts)), client typé `createClient<Database>`, tous les `any` du store remplacés. A révélé et corrigé un bug latent : insert `profiles` sans `email` dans [src/pages/Auth.tsx](src/pages/Auth.tsx). *(À terme : régénérer via `supabase gen types`.)*
* [ ] **🔴 Remplacer le re-fetch global par des mutations ciblées.** Chaque écriture appelle `get().initialize()` (re-charge **toutes** les tables). Acceptable à petite échelle, intenable au-delà de quelques centaines de missions. Passer à des updates optimistes + invalidation ciblée.
* [ ] **🟡 Politiques RLS Supabase.** Vérifier/durcir les Row-Level Security : un technicien ne doit pouvoir lire/écrire que ses propres missions et pointages côté base (pas seulement côté UI).
* [ ] **🟢 Migration SQL `checked`.** Le code tolère encore l'absence de la colonne `checked` (commentaires « tant que la migration n'a pas été appliquée »). Finaliser et figer la migration.

### 🟠 P1 — Expérience terrain (forte valeur métier)

Ce qui fait gagner du temps aux équipes sur le terrain.

* [x] **🔴 Mode PWA / Offline-first.** Rendre l'app installable et fonctionnelle sans réseau (lieux d'événement mal couverts). Cache des missions du jour + file de synchro des pointages QR différés. *La fonctionnalité la plus demandée par le terrain.*
* [ ] **🟡 Signature électronique tactile.** Composant `<canvas>` sur le portail Technicien pour faire signer le bon de livraison au client (remplace le papier imprimé). Stocker la signature dans Supabase Storage, l'intégrer à la fiche de mission.
* [ ] **🟢 Cartographie & GPS.** Rendre l'adresse de la mission cliquable → ouverture Google/Apple Maps (app-linking). Étape 2 : calcul de trajet / temps estimé.
* [ ] **🟡 Suivi des pannes & retours matériel.** Statut « En panne / Maintenance » au retour de mission + upload photo (preuve du dégât) via Supabase Storage. Retirer automatiquement le matériel en panne du stock disponible.
* [ ] **🟢 Glisser-déposer enrichi.** Drop zones visuelles sur le planning, assignation instantanée camion/technicien par drag & drop (FullCalendar `eventDrop` / `resourceTimeline`).

### 🟡 P2 — Confort & communication

* [ ] **🔴 Notifications push & mini-chat de mission.** Messagerie temps-réel par mission (le bureau prévient le camion d'un changement logistique). S'appuie sur Realtime déjà en place + Web Push pour la PWA. Remplace SMS/WhatsApp.
* [ ] **🟢 Mode sombre.** Utile pour les montages/démontages de nuit. Tailwind v4 `dark:` + persistance du choix.
* [ ] **🟡 Accessibilité (WAI-ARIA).** Adopter des primitives headless (Radix/Headless UI) pour les modales et menus → navigation clavier complète.
* [ ] **🟢 Recherche & filtres globaux.** Barre de recherche sur le planning (par client, technicien, statut, type de mission).
* [ ] **🟢 Notifications de conflit proactives.** La détection de conflits existe ([src/lib/conflicts.ts](src/lib/conflicts.ts)) ; la rendre visible en temps réel à la création de mission (toast/badge), pas seulement à l'affichage.

### 🟢 P3 — Croissance & métier avancé

* [ ] **🔴 Multi-agences (multi-tenant).** Isolation des données par agence (`agency_id` + RLS) pour proposer l'app en SaaS à plusieurs structures.
* [ ] **🟡 Exports comptables / facturation.** Génération de devis et bons de commande à partir des missions ; export PDF/CSV.
* [x] **🟡 Gestion des disponibilités techniciens.** Congés, indisponibilités, compétences requises par mission → suggestion d'affectation.
* [ ] **🟢 Historique & journal d'audit.** Traçabilité des modifications de mission (qui a changé quoi, quand).
* [ ] **🟡 Rapports planifiés.** Envoi automatique par e-mail des stats hebdo/mensuelles aux gérants (Supabase Edge Functions + cron).

---

## 🧪 Chantiers transverses (à mener en continu)

* [ ] **Tests** — Aucun test automatisé pour l'instant. Mettre en place Vitest (unitaire : store, conflits) + Playwright (parcours critiques : login, création mission, scan QR).
* [ ] **CI/CD** — Pipeline lint + build + tests à chaque PR.
* [ ] **Observabilité** — Capture des erreurs front (Sentry ou équivalent) au-delà du `console.error`.
* [ ] **Documentation** — README de mise en route + schéma de la base Supabase + variables d'environnement.

---

## 🎯 Proposition de séquencement

1. **Sprint 1–2 (Stabilisation)** : P0 dans l'ordre — types, RLS, migration `checked`, normalisation du stock.
2. **Sprint 3–4 (Terrain)** : PWA offline + signature électronique + cartographie. Le cœur de la proposition de valeur mobile.
3. **Sprint 5 (Logistique)** : suivi des pannes, drag & drop, conflits proactifs.
4. **Sprint 6+ (Communication & SaaS)** : chat/push, mode sombre, puis ouverture multi-agences.

> Recommandation : ne pas lancer les P1/P2 mobiles (PWA, offline) **avant** d'avoir réglé le re-fetch global (P0), sinon la synchro hors-ligne se construira sur une base instable.
