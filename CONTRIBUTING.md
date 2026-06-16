# Contribuer — NeuroEvent

Merci pour votre intérêt ! Ce guide explique comment contribuer efficacement à ce projet.

---

## Prérequis

| Outil | Version minimale | Installation |
|-------|----------------|-------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Inclus avec Node.js |
| Git | any | [git-scm.com](https://git-scm.com) |
| Un compte Supabase | — | [supabase.com](https://supabase.com) (tier gratuit) |

### Setup local

```bash
git clone https://github.com/<username>/eventplanner-pro.git
cd eventplanner-pro
npm install
cp .env.example .env.local
# RENSEIGNER VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local
npm run dev
```

L'application tourne sur `http://localhost:3000`.

---

## Workflow Git

### 1. Branching

Créer une branche feature depuis `main` :

```bash
git checkout main
git pull origin main
git checkout -b feat/ma-nouvelle-fonctionnalité
git checkout -b fix/correction-du-bug-truc
git checkout -b chore/nettoyage-code
```

**Convention de nommage** : `type/description-courte`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `chore` | Tâche administrative (deps, config, cleanup) |
| `docs` | Documentation uniquement |
| `refactor` | Refactoring sans changement de comportement |
| `test` | Ajout ou correction de tests |

### 2. Commits — Conventional Commits

Format : `type(scope): description`

**Règles :**
- Le type est **en anglais** (feat, fix, chore…).
- La description est **en français** (impératif présent, pas de point final).
- Le scope est optionnel et correspond au dossier/page impacté.

```bash
# ✅ Bons exemples
git commit -m "feat(planning): ajouter la vue resource timeline"
git commit -m "fix(auth): corriger la redirection après déconnexion"
git commit -m "chore(deps): mettre à jour react-router en 7.19"
git commit -m "docs(api): documenter l'endpoint time_logs"
git commit -m "refactor(store): extraire la logique de conflit dans conflicts.ts"
git commit -m "fix(equipment): corriger le calcul de stock disponible"

# ❌ Mauvais exemples
git commit -m "update stuff"
git commit -m "Fixed bug"
git commit -m "ajout du scan QR"  # type en français
git commit -m "feat: nouvelle fonctionnalité super."  # point final
```

**Outil recommandé** : `cz-cli` (Conventional Changelog) — `npm i -g commitizen`.

### 3. Push

```bash
git push origin feat/ma-nouvelle-fonctionnalité
```

### 4. Pull Request

**Titre** : reprend la convention du commit, ex : `feat(planning): ajouter la vue resource timeline`.

**Contenu obligatoire** :
```
## Ce que fait cette PR
- Description courte des changements

## Détail technique
- Points importants pour le reviewer

## Vérification
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run build` produit un bundle valide
- [ ] Test manuel (cas nominal + cas d'erreur)
```

**Règles de merge** : 1 approval requise, `npm run lint` + `npm run build` doivent passer en CI.

---

## Standards de code

### TypeScript

- **Mode strict** : `strict: true` dans `tsconfig.json`. Aucun `any` — les types sont définis dans `src/types/`.
- Types métier → `src/types/index.ts`.
- Types Supabase → `src/types/database.ts` (écrits à la main, compatibles `supabase gen types typescript`).
- Si une `any` est nécessaire (ex : réponse externe non typée), ladocumenter avec un `// TODO: typer` et créer un ticket de suivi.

```typescript
// ✅ Bon
import type { Mission } from '@/types';
const mission: Mission | undefined = missions.find(m => m.id === id);

// ❌ Mauvais
const mission: any = missions.find(m => m.id === id);
```

### Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichier composant | PascalCase | `MissionDetail.tsx` |
| Fichier utilitaire | camelCase | `conflicts.ts`, `utils.ts` |
| Fonction/constante | camelCase | `addMission`, `SKILL_CATALOG` |
| Type/Interface | PascalCase | `MissionStatus`, `EquipmentCategory` |
| Composant React | PascalCase | `export default function MissionDetail()` |
| Variable Zustand | camelCase | `missions`, `technicians` |
| Table Supabase | snake_case | `mission_technicians`, `driver_license` |

### Composants React

- Fonction fléchée pour les exports par défaut si composant pur : `export default function MissionDetail() { ... }`.
- Props typées avec une interface dédiée : `interface Props { missionId: string; onClose: () => void; }`.
- Éviter les `useEffect` chainés — privilégier `useMemo` pour les calculs derivés.

### Store Zustand

Toutes les mutations passent par le store (`src/store/index.ts`). Ne jamais appeler `supabase` directement depuis un composant pour une écriture.

Règle : `store.XXX()` → appelle Supabase → affiche un toast succès/erreur → appelle `get().initialize()` pour re-synchroniser.

### Commentaires

- **Français** pour la logique métier et les décisions non évidentes.
- **Anglais** pour le code (noms de variables, fonctions).
- Éviter les commentaires redondants avec le code. Privilégier le code auto-descriptif.
- Section d'en-tête de fichier pour les algorithmes complexes :

```typescript
/**
 * Calcule la disponibilité du matériel à une date donnée en croisant
 * toutes les missions planifiées. Utilisé pour détecter le surbooking.
 */
```

---

## Lancer les tests

> ⚠️ À compléter : les tests automatisés ne sont pas encore implémentés (cf. Roadmap : Vitest + Playwright).

Commandes attendues une fois le chantier test terminé :

```bash
# Unitaires (Vitest)
npm run test

# Unitaires en watch
npm run test:watch

# E2E (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## Processus de review

1. **Auto-review** : vérifier `npm run lint` et `npm run build` en local avant de demander une review.
2. **Review croisée** : chaque PR est relue par au moins un mainteneur.
3. **Discussion** : les commentaires utilisent le format :
   - 🟢 `Suggestion` : amélioration mineure
   - 🟡 `Question` : besoin de clarification
   - 🔴 `Blocking` : bloque le merge (bug, sécurité, régression)
4. **Merge** : squash merge uniquement — un seul commit dans `main` par PR.

---

## Code de conduite

- **Respect** : toute discussion est tenue sur un ton professionnel et respectueux.
- **Inclusivité** : les contributions de tous sont les bienvenues, quel que soit le niveau.
- **Focus** : les PR doivent être ciblées — une PR = une fonctionnalité ou un fix. Éviter les PR fourre-tout.
- **Performance** : toute nouvelle dépendance est justifiée. Preferer la bibliothèque triviale au package lourd.
- **Sécurité** : ne jamais commiter de secrets, clés API ou credentials. Le fichier `.env.local` est dans `.gitignore`.

---

## Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
- [FullCalendar Docs](https://fullcalendar.io/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router 7](https://reactrouter.com/)