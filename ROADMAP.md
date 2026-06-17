# Roadmap — NeuroEvent

> Dernière mise à jour : juin 2026 — reflète l'état du code à la racine (`main`).
> Conformément au principe « déjà livrée ne remonte plus dans le backlog ».

---

## V0 — Livré (socle production-ready)

### Authentification & Rôles

| Fonctionnalité | Détail | Fichier |
|---|---|---|
| ✅ Connexion email/password | Supabase Auth | `src/pages/Auth.tsx`, `src/store/auth.ts` |
| ✅ Inscription automatique Technicien | Crée `profiles` + `technicians` | `src/pages/Auth.tsx` |
| ✅ Résolution du rôle côté serveur | Table `profiles`, pas `user_metadata` | `src/store/auth.ts` |
| ✅ RBAC Admin / Technicien | Routage différencié dans `App.tsx` | `src/App.tsx` |

### Gestion des entités (CRUD complet)

| Fonctionnalité | Détail |
|---|---|
| ✅ Missions | CRUD, types (Livraison/Montage/Démontage/Événement complet), statuts, couleurs |
| ✅ Livraison & Reprise | Dates indépendantes (peuvent être veille/lendemain), temps d'installation en minutes |
| ✅ Génération fictive | 10 events juin 2026 à Paris/IDF avec livraison/reprise/temps de montage réalistes |
| ✅ Techniciens | CRUD, spécialité, couleur, compétences, permis (catégories, date), avatar |
| ✅ Camions | CRUD, nom, immatriculation, volume |
| ✅ Matériel | CRUD, catégories, quantité, import CSV |
| ✅ Clients | CRUD, coordonnées, notes |
| ✅ Utilisateurs | CRUD profils, promotion Admin |
| ✅ Indisponibilités techniciens | Création / suppression de congés et indisponibilités |

### Interface Admin

| Fonctionnalité | Détail |
|---|---|
| ✅ Planning FullCalendar | Vues jour, semaine, mois, resource timeline |
| ✅ Vue Kanban | Statuts en colonnes |
| ✅ Liste des missions | Recherche, filtres par statut, carte mobile / table desktop |
| ✅ Détails de mission | Livraison, reprise, temps d'installation, équipements, photos |
| ✅ Fiches de mission | Récapitulatifs imprimables avec signature |
| ✅ Génération QR codes | Impression multi-étiquettes matériel |
| ✅ Détection de conflits | Technicien/camion déjà affecté, stock insuffisant |
| ✅ Calcul du stock | Module pur `lib/stock.ts` : réservé, disponible, alertes |
| ✅ Statistiques Recharts | Missions/mois, top techniciens, taux matériel |
| ✅ Gestion des heures admin | Time logs et day logs techniciens |

### Interface Technicien (mobile-first, style "Uber Driver")

| Fonctionnalité | Détail |
|---|---|
| ✅ Dashboard personnel | Missions assignées, filtre par statut, swipe entre filtres, pull-to-refresh |
| ✅ Drawer mission | Onglets : Général, Client, Équipement, Check-list, Équipe, Heures, Photos, Rapport |
| ✅ Général | Livraison, reprise, temps d'installation, adresse (lien Maps) |
| ✅ Client | Coordonnées complètes |
| ✅ Équipement | Liste assignée avec pointage optimiste |
| ✅ Check-list | Liste personnalisable par technicien |
| ✅ Équipe | Collègues assignés avec avatars |
| ✅ Heures | Pointage début/fin, calcul automatique |
| ✅ Photos | Upload avant/après, compression JPEG, lightbox |
| ✅ Rapport | Compte-rendu texte |
| ✅ Scan QR embarqué | `html5-qrcode`, pointage matériel |
| ✅ Signature tactile | Canvas `react-signature-canvas`, stockage Supabase Storage |
| ✅ Upload photos terrain | Compression JPEG côté client, bucket `mission-photos` |
| ✅ Mode PWA / offline | Service worker Workbox, queue de synchro (`syncQueue`) |
| ✅ Profil & paramètres | Nom, téléphone, langue, notifications, avatar |
| ✅ Vue heures personnelles | Récapitulatif des pointages |

### Sécurité & Infrastructure

| Fonctionnalité | Détail |
|---|---|
| ✅ 100% TypeScript (0 any) | Types manuels dans `src/types/database.ts` |
| ✅ RLS durcies | SELECT filtré, UPDATE limité aux champs autorisés, écriture liaisons = admin only |
| ✅ Realtime Supabase | Canal `postgres_changes`, debounce 400 ms |
| ✅ Persistance locale | Zustand `persist` middleware (`localStorage`) |
| ✅ Mode sombre immersif | Thème Uber Driver pour le portail Technician |
| ✅ PWA installable | `vite-plugin-pwa`, manifest avec icônes |
| ✅ Tests unitaires Vitest | `lib/conflicts.ts`, `lib/stock.ts` |
| ✅ Code-splitting | Lazy loading par route |

---

## V1 — Court terme (< 3 mois)

### Logistique & planning (P0)

| Fonctionnalité | Détail | Statut |
|---|---|---|
| 📋 Glisser-déposer enrichi | Drop zones visuelles sur le planning, affectation camion/technicien par drag FullCalendar | 📋 Planifié |
| 📋 Vue carte / itinéraire | Carte des missions du jour avec calcul d'itinéraire optimisé (TSP) | 📋 Planifié |
| 📋 Notifications push | Web Push pour nouvelles missions, rappels de livraison | 📋 Planifié |

### Matériel & stock (P1)

| Fonctionnalité | Détail | Statut |
|---|---|---|
| 📋 Suivi des pannes & maintenance | Statut `En panne` pour le matériel + upload photo de dégâts | 📋 Planifié |
| 📋 Historique de maintenance | Dates d'intervention, coûts, prestataire | 📋 Planifié |
| 📋 Réservation de matériel | Réservation anticipée avec fenêtre de validité | 📋 Planifié |

### Confort & accessibilité (P2)

| Fonctionnalité | Détail | Statut |
|---|---|---|
| 📋 Accessibilité WAI-ARIA | Radix UI / Headless UI, navigation clavier | 📋 Planifié |
| 📋 Historique & journal d'audit | Traçabilité des modifications (qui, quand, quoi) | 📋 Planifié |
| 📋 Recherche globale | Barre de recherche transversale missions / clients / matériel / techniciens | 📋 Planifié |

---

## V2+ — Vision long terme

| Fonctionnalité | Détail | Statut |
|---|---|---|
| 💡 Mini-chat intégré | Realtime par mission, messagerie entre techniciens et admin | 💡 Idée |
| 💡 Multi-agences (SaaS multi-tenant) | Isolation par `agency_id` + RLS | 💡 Idée |
| 💡 Exports comptables / facturation | Devis et bons de commande PDF depuis les missions | 💡 Idée |
| 💡 Rapports planifiés | Envoi automatique hebdo/mensuel (Edge Functions + cron Supabase) | 💡 Idée |
| 💡 Intégration Google Calendar / iCal | Synchronisation bidirectionnelle des missions | 💡 Idée |
| 💡 App native (Capacitor / React Native) | Distribution via stores, notifications natives, accès caméra optimisé | 💡 Idée |

---

## Backlog technique (non planifié)

| Idée | Description |
|---|---|
| 🔲 Tests E2E | Playwright (login, création mission, scan QR, pointage) |
| 🔲 Pipeline CI/CD | lint + build + tests à chaque PR (GitHub Actions) |
| 🔲 Observabilité | Capture d'erreurs front (Sentry ou équivalent) |
| 🔲 Caching optimisé | React Query / TanStack Query pour remplacer les re-fetch manuels |
| 🔲 i18n complet | Traduction EN/ES/DE en plus du FR |

---

## Historique des livraisons majeures

| Date | Livraison |
|---|---|
| Juin 2026 | V0 complète : missions avec livraison/reprise/temps d'installation, portail technicien enrichi (drawer onglets, photos, rapport, heures), RLS durcies, stock calculé, tests Vitest |
| Mai 2026 | Socle initial : CRUD complet, planning FullCalendar, kanban, dashboard technicien, scan QR, signature, upload photos, PWA |
