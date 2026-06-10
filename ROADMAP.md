# Roadmap du Projet : EventFlow Planning

Cette roadmap détaille les prochaines étapes de développement de l'application, en mettant l'accent sur la transition vers une architecture cloud et le développement d'outils de terrain.

## Phase 1 : Migration vers une Base de Données Cloud (Supabase) ✅ [TERMINÉE]

L'objectif actuel était de remplacer le store local (Zustand en mémoire) par une véritable base de données relationnelle persistante et temps réel via **Supabase (PostgreSQL)**.

*   ✅ **Modélisation de la Base de Données :**
    *   `missions` (id, titre, date_debut, date_fin, type, statut, adresse, client...)
    *   `techniciens` (id, nom, prenom, specialite, couleur)
    *   `camions` (id, nom, plaque, volume)
    *   `equipements` (id, nom, categorie, quantite_totale)
    *   `mission_techniciens` (table de jointure)
    *   `mission_equipements` (table de jointure avec `quantite`)
*   ✅ **Intégration du SDK Supabase :**
    *   Configuration du client `@supabase/supabase-js`.
    *   Mise en place des requêtes CRUD asynchrones pour remplacer les fonctions locales de Zustand.
    *   Abonnement aux événements temps réel Supabase pour que le planning se mette à jour instantanément sur tous les écrans du bureau.
*   ✅ **Authentification et Rôles (Supabase Auth) :**
    *   Création des comptes d'accès avec gestion de rôles : `Admin` (régie/bureau) et `Technicien` (terrain) via la table `profiles`.

## Phase 2 : Développement du Portail Mobile pour les Techniciens ✅ [TERMINÉE]

Afin d'améliorer la communication avec les équipes sur le terrain, une version web app mobile optimisée a été développée, adaptée au rôle de l'utilisateur connecté.

*   ✅ **Interface "Mobile-First" :**
    *   Vue simplifiée de type Agenda pour le technicien : "Mes missions du jour / de la semaine".
    *   Accès détaillé à chaque fiche de mission (horaires, adresse, véhicule, collègues assignés).
*   ✅ **Actions Terrain & Supabase :**
    *   Mise à jour des statuts de mission par le technicien ("Planifiée", "En cours", "Terminée").
    *   Mise à jour en temps réel sur le tableau de bord Admin.
*   ✅ **Fonctionnalités Opérationnelles & Paramètres :**
    *   Lien direct vers Google Maps/Waze depuis la fiche mission.
    *   La création du compte Technicien lie automatiquement les données au backend.
    *   Page de suppression / déconnexion / mise à jour du profil.

## Phase 3 : Optimisations & Pilotage (Back-Office)

*   **Tableau de bord de rentabilité :** Suivi consolidé du coût des ressources.
*   **Statistiques de taux d'occupation :** Visualisation de la charge de chaque camion et du taux de sortie du parc matériel.
*   **Génération de documents automatisée :** Création des Devis et Bons de Livraison (PDF) directement depuis le calendrier.
*   **Notifications Systèmes :** Envoi de SMS ou d'e-mails automatiques aux techniciens en cas de modification de l'horaire de leur mission pour le lendemain.
