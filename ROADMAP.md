# EventFlow Pro

Plateforme professionnelle de planification pour agences événementielles facilitant l'orchestration des missions de terrain, des ressources humaines (techniciens), des véhicules et du matériel technique.

## 🚀 Fonctionnalités Actuelles

*   **Calendrier Interactif & Plannings :** Visualisation globale et Timeline des missions, camions, et équipement (FullCalendar). Prévention des conflits logistiques.
*   **Tableau de Bord Technicien :** 
    *   Interface optimisée mobile pour les techniciens sur le terrain.
    *   Vue détaillée des missions (colisages, collègues, camions).
    *   **Scanner QR Code embarqué** pour valider rapidement les entrées/sorties du matériel assigné.
*   **Gestion du Parc & Impression QR Codes :** Suivi des équipements avec génération facile et mode multi-impression de QR codes pour étiqueter son parc.
*   **Fiches de Mission & Exports :** Génération de fiches récapitulatives propres et imprimables avec visa client pour l'approbation logistique.
*   **Statistiques (Analytics) :** Tableau de bord analytique graphique de la volumétrie (Missions/mois, Top techniciens, taux de couverture matérielle) via Recharts.

## 🛠 Technologies Utilisées
*   **Frontend :** React 19, TypeScript, Vite
*   **État/State :** Zustand
*   **UI & Styling :** Tailwind CSS v4, Lucide React
*   **Libertés Techniques :** FullCalendar, Recharts, html5-qrcode, react-qr-code, date-fns

## 🗺 Roadmap : Améliorations UX/UI & Fonctionnelles

### 🎨 Améliorations UX / UI (Expérience & Interface)
* [ ] **Mode PWA (Progressive Web App) :** Rendre l'interface utilisateur installable sur smartphone et tablette et fonctionnelle hors ligne pour les lieux d'événements sans réseau ("Offline-first").
* [ ] **Thème Mode Sombre (Dark Mode) :** Utile pour les monteurs/démonteurs d'événements intervenant la nuit ou tôt le matin, réduisant la fatigue visuelle.
* [ ] **Glisser-Déposer Amélioré (Drag & Drop) :** Rendre les cartes de missions fluides, avec indicateur visuel (drop zones) lors du déplacement et assignation instantanée de camions/techniciens.
* [ ] **Feedbacks & Toasts :** Ajouter des notifications de succès instantanées (ex: "QR code matériel scanné avec succès", "Mission assignée") via une librairie de toast non bloquante.
* [ ] **Accessibilité Radix UI / Headless :** Continuer d'embarquer des composants headless pour la totale souplesse clavier (WAI-ARIA).

### 🚀 Fonctionnalités Architecturales
* [ ] **Backend Persistant (Supabase/Firebase) :** Connecter Zustand à une vraie base de données temps-réel (PostgreSQL via Supabase ou Firestore) avec Firebase Auth pour la connexion multi-agences et le travail asynchrone sécurisé en équipe.
* [ ] **Rôles & Permissions (RBAC) :** Différencier l'Admin (agence), le Dispatcher (logistique), et l'Utilisateur Final (le technicien ne doit voir que son propre Dashboard réduit).
* [ ] **Signature Électronique sur Mobile :** Ajouter un composant Canvas natif sur le portail Technicien pour signer de manière tactile le bon de livraison lors de la remise au client, plutôt qu'une version papier imprimée.
* [ ] **Cartographie & Intégration GPS :** Rendre l'adresse de l'événement cliquable pour ouvrir Google Maps / Apple Maps (App-linking) ou afficher un panneau carte enrichi de calcul de trajets.
* [ ] **Suivi des Pannes & Retours :** Créer un statut "Matériel en Panne / Maintenance" suite au retour de mission avec un champ "Ajouter une photo (preuve du dégât)".
* [ ] **Notifications Push & Chat :** Mini messagerie en temps réel sur la mission pour permettre au bureau de prévenir le camion d'un changement logistique (remplace l'usage massif des SMS/WhatsApp).

---