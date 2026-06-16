# Roadmap — NeuroEvent

> Dernière mise à jour : reflète l'état du code à la racine (`main`).
> Conformément au principe « déjà livrée ne remonte plus dans le backlog ».

---

## V0 — Livré (socle production-ready)

### Authentification & Rôles
| Fonctionnalité | Détail | Fichier |
|----------------|--------|---------|
| ✅ Connexion email/password | Supabase Auth | `src/pages/Auth.tsx`, `src/store/auth.ts` |
| ✅ Inscription automatique Technicien | Crée `profiles` + `technicians` | `src/pages/Auth.tsx:41-55` |
| ✅ Résolution du rôle côté serveur | Table `profiles`, pas `user_metadata` | `src/store/auth.ts:23-40` |
| ✅ RBAC Admin / Technicien | Routage différencié dans `App.tsx` | `src/App.tsx:82-110` |

### Gestion des entités (CRUD complet)
| Fonctionnalité | Détail |
|----------------|--------|
| ✅ Missions | CRUD, types (Livraison/Montage/Démontage/Événement complet), statuts, couleurs |
| ✅ Techniciens | CRUD, spécialité, couleur, compétences, permis, avatar |
| ✅ Camions | CRUD, nom, immatriculation, volume |
| ✅ Matériel | CRUD, catégories, quantité, import CSV |
| ✅ Clients | CRUD, coordonnées, notes |
| ✅ Utilisateurs | CRUD profils, promotion Admin |
| ✅ Indisponibilités techniciens | Création / suppression de congés et indisponibilités |

### Interface Admin
| Fonctionnalité | Détail |
|----------------|--------|
| ✅ Planning FullCalendar | Vues jour, semaine, mois, resource timeline |
| ✅ Vue Kanban | Statuts en colonnes |
| ✅ Fiches de mission | Récapitulatifs imprimables avec signature |
| ✅ Génération QR codes | Impression multi-étiquettes matériel |
| ✅ Détection de conflits | Technicien/camion déjà affecté, stock insuffisant |
| ✅ Statistiques Recharts | Missions/mois, top techniciens, taux matériel |
| ✅ Gestion des heures admin | Time logs et day logs techniciens |

### Interface Technicien (mobile-first)
| Fonctionnalité | Détail |
|----------------|--------|
| ✅ Dashboard personnel | Missions assignées, filtre par statut |
| ✅ Détail mission | Adresse (lien Maps), collègues, camion, check-list |
| ✅ Scan QR embarqué | `html5-qrcode`, pointage matériel optimiste |
| ✅ Signature tactile | Canvas `react-signature-canvas`, stockage Supabase Storage |
| ✅ Upload photos terrain | Compression JPEG côté client, stockage `mission-photos` |
| ✅ Mode PWA / offline | Service worker Workbox, queue de synchro (`syncQueue`) |

### Infrastructure & qualité
| Fonctionnalité | Détail |
|----------------|--------|
| ✅ 100% TypeScript (0 any) | Types manuels dans `src/types/database.ts` |
| ✅ Realtime Supabase | Canal `postgres_changes`, debounce 400 ms |
| ✅ Persistance locale | Zustand `persist` middleware (`localStorage`) |
| ✅ Mode sombre immersif | Thème Uber Driver pour le portail Technician |
| ✅ PWA installable | `vite-plugin-pwa`, manifest avec icônes |

---

## V1 — Court terme (< 3 mois)

### Fiabilité & dette technique (P0)

| Fonctionnalité | Détail | Statut |
|----------------|--------|--------|
| ✅ Mutations ciblées (fin du re-fetch global) | 6 fetchers par table + mappers extraits, `set()` partiels sur les 18 mutations, realtime limité à `missions`+`equipment` | ✅ Livré |
| ✅ RLS durcies Supabase | Technicien = SELECT filtré sur ses affectations via helpers `SECURITY DEFINER` ; UPDATE mission/equipment = trigger qui ne laisse passer que `status`/`signature_url`/`checked` ; écriture sur les liaisons = admin only | ✅ Livré |
| ✅ Stock matériel normalisé | Module pur `src/lib/stock.ts` : `computeReservedByWindow`, `computeReservedAt`, `reservedQuantityFor`, `availableQuantityFor`, `stockOverviewAt`, `checkStockShortages`. Vocabulaire `ACTIVE_STATUSES` (`Planifiée`+`En cours` réservent / `Terminée` libère). `lib/conflicts.ts` délègue désormais à ce module. | ✅ Livré |

### Terrain (P1)

| Fonctionnalité | Détail | Statut |
|----------------|--------|--------|
| 📋 Glisser-déposer enrichi | Drop zones visuelles sur le planning, affectation camion/technicien par drag FullCalendar | 📋 Planifié |
| 📋 Suivi des pannes & maintenance | Statut `En panne` pour le matériel + upload photo de dégâts | 📋 Planifié |

### Confort (P2)

| Fonctionnalité | Détail | Statut |
|----------------|--------|--------|
| 📋 Accessibilité WAI-ARIA | Radix UI / Headless UI pour les modales et menus, navigation clavier | 📋 Planifié |
| 📋 Historique & journal d'audit | Traçabilité des modifications (qui, quand, quoi) | 📋 Planifié |

---

## V2+ — Vision long terme

| Fonctionnalité | Détail | Statut |
|----------------|--------|--------|
| 💡 Notifications push & mini-chat | Realtime par mission, Web Push via le service worker | 💡 Idée |
| 💡 Multi-agences (SaaS multi-tenant) | Isolation par `agency_id` + RLS | 💡 Idée |
| 💡 Exports comptables / facturation | Devis et bons de commande PDF depuis les missions | 💡 Idée |
| 💡 Rapports planifiés | Envoi automatique hebdo/mensuel (Edge Functions + cron Supabase) | 💡 Idée |
| 💡 Intégration Gemini AI | ⚠️ Référencée dans `.env.example` mais non implémentée — clarifier le cas d'usage | 💡 Idée |

---

## Backlog (non planifié)

| Idée | Description |
|------|-------------|
| 🔲 Tests automatisés | Vitest (unitaire store, `conflicts.ts`) + Playwright (login, création mission, scan QR) |
| 🔲 Pipeline CI/CD | lint + build + tests à chaque PR (GitHub Actions) |
| 🔲 Observabilité | Capture d'erreurs front (Sentry ou équivalent) |
| 🔲 Recherche globale | Barre de recherche transversale missions / clients / matériel |
| �2 Intégration calendrier tiers | Synchronisation Google Calendar / iCal |