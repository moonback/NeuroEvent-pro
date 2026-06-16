# API Reference — NeuroEvent

> Cette référence documente l'API REST générée automatiquement par **Supabase PostgREST**.
> Toutes les requêtes passent par le client `@supabase/supabase-js` (non-documented for brevity),
> mais les principes (authentification, paramètres, réponses) s'appliquent.

---

## Authentification

| Méthode | Détail |
|---------|--------|
| **Type** | Bearer token JWT (fourni par Supabase Auth) |
| **Header** | `Authorization: Bearer <token>` (ajouté automatiquement par `@supabase/supabase-js`) |
| **Non authentifié** | Retourne `401 Unauthorized` — le client redirige vers `/login` |

### Endpoints Supabase Auth (accès direct)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/v1/token?grant_type=password` | Connexion email + mot de passe |
| `POST` | `/auth/v1/signup` | Inscription |
| `POST` | `/auth/v1/logout` | Déconnexion |
| `GET` | `/auth/v1/user` | Utilisateur connecté |

> ⚠️ À compléter : l'URL complète est `https://<VITE_SUPABASE_URL>/auth/v1/...` (v1 API). Consulter Supabase Dashboard → Settings → API pour les URLs exactes.

---

## Conventions

- **Format de réponse** : JSON.
- **Horodatages** : ISO 8601 UTC (`2026-06-17T14:30:00.000Z`).
- **IDs** : UUID v4.
- **Erreurs** : `{ "message": "...", "code": "..." }`.
- **Codes HTTP courants** : `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `406 Not Acceptable`, `409 Conflict`, `500 Internal Server Error`.

---

## Domaines fonctionnels

---

### Authentification

#### `POST /auth/v1/signup` — Inscription

**Description** : Crée un compte Technicien. Crée automatiquement une fiche `profiles` et `technicians`.

**Authentification requise** : Non (inscription publique).

| Paramètre | Type | Corps JSON | Description |
|-----------|------|------------|-------------|
| `email` | string | ✅ requis | Adresse email |
| `password` | string | ✅ requis | Mot de passe (min. 6 caractères) |
| `options.data.first_name` | string | ✅ requis | Prénom |
| `options.data.last_name` | string | ✅ requis | Nom |
| `options.data.role` | string | ⬜ | Force `Technicien` (sécurité) |

**Exemple de requête :**

```bash
curl -X POST https://<SUPABASE_URL>/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@exemple.fr",
    "password": "motdepasse123",
    "options": {
      "data": {
        "first_name": "Jean",
        "last_name": "Dupont",
        "role": "Technicien"
      }
    }
  }'
```

**Réponse succès** : `201 Created`

```json
{
  "id": "abc123 uuid",
  "email": "tech@exemple.fr",
  "created_at": "2026-06-17T14:00:00.000Z"
}
```

**Réponse erreur** : `400 Bad Request`

```json
{ "message": "User already registered", "code": "user_already_exists" }
```

---

#### `POST /auth/v1/token?grant_type=password` — Connexion

**Description** : Obtient un JWT pour les requêtes suivantes.

| Paramètre | Type | Corps JSON | Description |
|-----------|------|------------|-------------|
| `email` | string | ✅ requis | |
| `password` | string | ✅ requis | |

**Exemple de requête :**

```bash
curl -X POST 'https://<SUPABASE_URL>/auth/v1/token?grant_type=password' \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@exemple.fr", "password": "xxx" }'
```

**Réponse succès** : `200 OK`

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": { "id": "...", "email": "admin@exemple.fr" }
}
```

---

### Profils & Utilisateurs

#### `GET /profiles` — Lister les profils

**Description** : Retourne tous les profils utilisateurs.

**Authentification requise** : Oui.

**Paramètres de requête** :

| Nom | Type | Description |
|-----|------|-------------|
| `select` | string | Colonnes à retourner (ex : `id,email,role`) |
| `eq.role` | string | Filtrer par rôle (`Admin`, `Technicien`) |
| `order` | string | Tri (`created_at.desc`) |

**Exemple :**

```bash
curl 'https://<SUPABASE_URL>/rest/v1/profiles?select=id,email,first_name,last_name,role&order=created_at.desc' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>"
```

**Réponse succès** : `200 OK` — tableau de `profiles`.

---

#### `PATCH /profiles` — Mettre à jour un profil

**Description** : Met à jour le profil de l'utilisateur connecté.

**Authentification requise** : Oui.

| Paramètre | Type | Description |
|-----------|------|-------------|
| Body | JSON | `{ first_name, last_name, phone, avatar_url }` |
| Filtre requis | query | `.eq('id', userId)` — sécurité côté client |

> ⚠️ Le rôle ne peut PAS être modifié via cette endpoint par l'utilisateur lui-même (restriction Supabase côté trigger ou politique RLS — cf. `audit_security` migration).

**Réponse succès** : `200 OK` — objet profil mis à jour.

---

### Techniciens

#### `GET /technicians` — Lister les techniciens

**Description** : Retourne tous les techniciens avec leurs compétences.

**Authentification requise** : Oui.

| Nom | Type | Description |
|-----|------|-------------|
| `select` | string | `*` (toutes colonnes) ou explicite |
| `order` | string | Tri (`last_name.asc`) |

**Exemple :**

```bash
curl 'https://<SUPABASE_URL>/rest/v1/technicians?select=*&order=last_name.asc' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>"
```

**Réponse succès** : `200 OK`

```json
[
  {
    "id": "uuid",
    "first_name": "Marie",
    "last_name": "Martin",
    "specialty": "Sonorisation",
    "color": "#3b82f6",
    "skills": ["sono", "eclairage"],
    "driver_license": { "hasLicense": true, "categories": ["B"] },
    "avatar_url": "https://...",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

---

#### `POST /technicians` — Créer un technicien

**Description** : Ajoute un nouveau technicien (indépendamment d'un compte utilisateur).

**Authentification requise** : Oui.

**Corps** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `first_name` | string | ✅ | Prénom |
| `last_name` | string | ✅ | Nom |
| `specialty` | string | ✅ | Spécialité |
| `color` | string | ✅ | Couleur hexadécimale |
| `skills` | text[] | ⬜ | Tableau de compétences |
| `driver_license` | JSONB | ⬜ | `{ hasLicense, since?, categories? }` |
| `avatar_url` | string | ⬜ | URL de l'avatar |

**Exemple :**

```bash
curl -X POST 'https://<SUPABASE_URL>/rest/v1/technicians' \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "first_name": "Jean",
    "last_name": "Dupont",
    "specialty": "Montage scène",
    "color": "#ef4444",
    "skills": ["montage_scene", "rigging"]
  }'
```

**Réponse succès** : `201 Created`.

---

#### `PATCH /technicians` — Mettre à jour un technicien

**Authentification requise** : Oui.

**Filtre** : `.eq('id', technicianId)` requis.

**Corps** : partiel (uniquement les champs à mettre à jour).

---

#### `DELETE /technicians` — Supprimer un technicien

**Authentification requise** : Oui.

**Filtre** : `.eq('id', technicianId)` requis.

**Effets** : supprime aussi les `technician_unavailabilities` associées (CASCADE).

---

### Missions

#### `GET /missions` — Lister les missions

**Description** : Retourne les missions. Inclut les jointures `mission_technicians(technician_id)` et `mission_equipments(*)` avec `.select('*, mission_technicians(technician_id), mission_equipments(*)')`.

**Authentification requise** : Oui.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `select` | string | Colonnes + relations imbriquées |
| `gte.start_date` | string | Filtrer par date début (`2026-06-01T00:00:00`) |
| `lte.start_date` | string | Filtrer par date fin |
| `eq.status` | string | Filtrer par statut |
| `order` | string | Tri (`start_date.asc`) |

**Exemple :**

```bash
curl 'https://<SUPABASE_URL>/rest/v1/missions?select=*&order=start_date.asc' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>"
```

**Réponse succès** : `200 OK` — tableau de missions enrichies.

---

#### `POST /missions` — Créer une mission

**Authentification requise** : Oui.

**Corps** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | string | ✅ | Titre de la mission |
| `type` | mission_type | ✅ | `Livraison`, `Montage`, `Démontage`, `Événement complet` |
| `client` | string | ✅ | Nom du client (texte ou copié depuis la fiche) |
| `client_id` | uuid | ⬜ | FK vers `clients` |
| `address` | string | ✅ | Adresse du lieu |
| `start_date` | timestamptz | ✅ | Date/heure de début |
| `end_date` | timestamptz | ✅ | Date/heure de fin |
| `truck_id` | uuid | ⬜ | FK vers `trucks` |
| `required_skills` | text[] | ⬜ | Compétences requises + métadonnées (préfixe `meta:`) |
| `status` | mission_status | ✅ | `Planifiée`, `En cours`, `Terminée` |
| `color` | string | ✅ | Couleur hexadécimale |
| `signature_url` | string | ⬜ | URL de la signature client |

**Exemple :**

```bash
curl -X POST 'https://<SUPABASE_URL>/rest/v1/missions' \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "Festival Jazz — Montage",
    "type": "Montage",
    "client": "Assoc. Jazz Paris",
    "address": "12 rue de la Scène, 75001 Paris",
    "start_date": "2026-07-01T08:00:00Z",
    "end_date": "2026-07-01T18:00:00Z",
    "status": "Planifiée",
    "color": "#8b5cf6"
  }'
```

**Réponse succès** : `201 Created` — mission créée avec son ID.

---

#### `PATCH /missions` — Mettre à jour une mission

**Authentification requise** : Oui.

**Filtre** : `.eq('id', missionId)` requis.

**Corps** : partiel (uniquement les champs à modifier).

---

#### `DELETE /missions` — Supprimer une mission

**Authentification requise** : Oui.

**Filtre** : `.eq('id', missionId)` requis.

**Effets** : supprime aussi `mission_technicians` et `mission_equipments` (CASCADE).

---

### Affectations (mission_technicians, mission_equipments)

#### `POST /mission_technicians` — Affecter un technicien

**Corps** :

```json
{ "mission_id": "uuid", "technician_id": "uuid" }
```

**Note** : La contrainte `PRIMARY KEY (mission_id, technician_id)` garantit l'unicité. Utiliser `.upsert()` pour éviter les erreurs 409 en cas de re-soumission.

---

#### `POST /mission_equipments` — Ajouter du matériel à une mission

**Corps** :

```json
{ "mission_id": "uuid", "equipment_id": "uuid", "quantity": 2 }
```

---

#### `PATCH /mission_equipments` — Pointer du matériel

**Description** : Met à jour la colonne `checked` (pointage technicien).

**Filtres** : `.eq('mission_id', missionId).eq('equipment_id', equipmentId)`.

**Corps** : `{ "checked": true }`.

---

### Disponibilités

#### `GET /technician_unavailabilities` — Lister les indisponibilités

**Description** : Retourne les congés et indisponibilités.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `eq.technician_id` | uuid | Filtrer par technicien |

---

#### `POST /technician_unavailabilities` — Créer une indisponibilité

**Corps** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `technician_id` | uuid | ✅ | FK |
| `start_date` | timestamptz | ✅ | Début |
| `end_date` | timestamptz | ✅ | Fin |
| `type` | unavailability_type | ✅ | `Congé` ou `Indisponibilité` |
| `reason` | string | ⬜ | Motif |

---

#### `DELETE /technician_unavailabilities` — Supprimer

**Filtre** : `.eq('id', unavailabilityId)`.

---

### Camions

#### `GET /trucks` — Lister les camions

**Description** : Retourne tous les véhicules.

#### `POST /trucks` — Créer un camion

**Corps** : `{ "name": "Iveco 1", "plate": "AB-123-CD", "volume": 20 }` (volume en m³).

---

### Matériel

#### `GET /equipments` — Lister le matériel

**Description** : Retourne tous les équipements.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `eq.category` | string | Filtrer par catégorie |

---

#### `POST /equipments` — Créer un équipement

**Corps** : `{ "name": "Projecteur laser", "category": "Éclairage", "total_quantity": 4 }`.

---

#### `POST /equipments` — Import CSV (batch upsert)

**Description** : Utilise `upsert()` sur `equipments` avec les IDs fournis pour faire un import batch.

---

### Clients

#### `GET /clients` — Lister les clients

**Description** : Retourne tous les clients, triés par nom.

#### `POST /clients` — Créer un client

**Corps** :

| Champ | Type | Requis |
|-------|------|--------|
| `name` | string | ✅ |
| `contact_name` | string | ⬜ |
| `email` | string | ⬜ |
| `phone` | string | ⬜ |
| `address` | string | ⬜ |
| `notes` | string | ⬜ |

---

### Temps & Journalier

#### `GET /mission_time_logs` — Lister les pointages horaires

| Paramètre | Type | Description |
|-----------|------|-------------|
| `eq.mission_id` | uuid | Filtrer par mission |
| `eq.technician_id` | uuid | Filtrer par technicien |

---

#### `POST /mission_time_logs` — Démarrer / arrêter un créneau

**Corps** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `mission_id` | uuid | ✅ | |
| `technician_id` | uuid | ✅ | |
| `start_time` | timestamptz | ✅ | |
| `end_time` | timestamptz | ⬜ | Null = en cours |
| `note` | string | ⬜ | |

---

#### `GET /technician_day_logs` — Résumés journaliers

**Description** : Retourne le temps total par jour et par technicien.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `eq.technician_id` | uuid | |
| `gte.date` | string | Date début |
| `lte.date` | string | Date fin |

---

#### `POST /technician_day_logs` — Clôturer une journée

**Corps** :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `technician_id` | uuid | ✅ | |
| `date` | date | ✅ | `YYYY-MM-DD` |
| `first_mission_start` | timestamptz | ✅ | |
| `day_end_time` | timestamptz | ✅ | |
| `total_minutes` | integer | ✅ | Calculé côté client |

---

### Photos de mission

#### `GET /mission_photos` — Lister les photos

| Paramètre | Type | Description |
|-----------|------|-------------|
| `eq.mission_id` | uuid | Filtrer par mission |

---

#### `POST /mission_photos` — Ajouter une photo

**Description** : Insère la référence en base après upload dans Storage.

**Corps** :

```json
{
  "mission_id": "uuid",
  "type": "before",
  "url": "https://<SUPABASE_URL>/storage/v1/object/public/mission-photos/...",
  "file_path": "uuid/before/1718630400000.jpg"
}
```

---

#### `DELETE /mission_photos` — Supprimer une photo

**Effets** : supprime d'abord le fichier dans Storage, puis la ligne en base.

---

### Storage (fichiers)

#### Upload dans `mission-photos`

```bash
curl -X POST 'https://<SUPABASE_URL>/storage/v1/object/mission-photos/mission-uuid/before/1718630400000.jpg' \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo-avant.jpg
```

**Réponse succès** : `{ "Key": "mission-photos/...", "id": "..." }`.

---

#### Upload dans `avatars`

 Même mécanisme que `mission-photos` avec le bucket `avatars`.

---

## Tableau récapitulatif des codes HTTP

| Code | Signification | Usage courant |
|------|---------------|--------------|
| `200` | OK | GET réussi, PATCH réussi |
| `201` | Created | POST insert réussi |
| `204` | No Content | DELETE réussi |
| `400` | Bad Request | Corps invalide, contraintes non respectées |
| `401` | Unauthorized | Token manquant ou expiré |
| `403` | Forbidden | RLS refuse l'accès |
| `404` | Not Found | Ressource introuvable |
| `406` | Not Acceptable | Requête mal formed |
| `409` | Conflict | Contrainte PRIMARY KEYviolée (doublon) |
| `500` | Internal Server Error | Erreur serveur Supabase |

> ⚠️ À compléter : les endpoints `/auth/v1/` utilisent des en-têtes spécifiques (`apikey` + `Authorization: Bearer`). Vérifier la configuration actuelle dans le code (`src/lib/supabase.ts`) pour confirmer les en-têtes utilisés par `@supabase/supabase-js`.