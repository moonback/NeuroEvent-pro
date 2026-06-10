# EventFlow Planning v2.4

Application de planning pour agence événementielle permettant de gérer les interventions (livraisons, montages, démontages), les camions, les techniciens et le parc matériel.

## Fonctionnalités Principales

*   **Calendrier Interactif :** Visualisation globale des missions avec FullCalendar.
*   **Planning Techniciens :** Vue par ressources pour affecter les collaborateurs et éviter les conflits d'emploi du temps.
*   **Gestion des Camions :** Suivi de l'occupation de la flotte de véhicules.
*   **Gestion du Matériel :** Suivi des stocks et prévention des conflits d'affectation des équipements.
*   **Export :** Impression des plans et fiches de mission au format PDF.

## Technologies Utilisées

*   **Frontend :** React 19, TypeScript, Vite
*   **Routage :** React Router
*   **State Management :** Zustand
*   **Calendrier :** FullCalendar (Daygrid, Timegrid, Resource Timeline)
*   **Style :** Tailwind CSS v4 (Thème "Professional Polish")
*   **Icônes :** Lucide React

## Installation & Lancement

1.  Installer les dépendances :
    ```bash
    npm install
    ```
2.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```
