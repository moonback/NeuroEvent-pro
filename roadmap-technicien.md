# Roadmap Évolutive : Portail Technicien & IA

Ce document définit la vision stratégique et les étapes clés pour transformer l'application du technicien en un outil d'accompagnement terrain ultra-performant, fluide et augmenté par l'intelligence artificielle.

---

## 🗺️ Phase 1 : UI/UX & Confort d'Utilisation (Court Terme)

L'objectif est d'optimiser l'ergonomie mobile et le confort visuel sur le terrain dans des conditions d'éclairage parfois difficiles (ex: coulisses sombres d'événements).

### 🎨 Améliorations de l'Interface
- **Thème Tactique Sombre (Ultra Dark)** : Optimisation des contrastes et de la palette de couleurs (utilisation de noirs purs `#000000` sur écrans OLED pour réduire la fatigue visuelle et économiser la batterie sur le terrain).
- **Micro-interactions Gestuelles** :
  - *Pull-to-refresh* natif sur la liste des missions pour actualiser les données.
  - Glissement horizontal (*swipe*) fluide entre les cartes de missions pour changer de jour.
- **Scanner Haute Performance** : Remplacement du scanner de base par un module caméra multi-code capable de scanner plusieurs codes-barres/QR codes simultanément en temps réel avec autofocus et retour haptique intelligent.

---

## ⚙️ Phase 2 : Fonctionnalités Métier Avancées (Moyen Terme)

Simplifier le travail administratif des techniciens et sécuriser les processus de livraison et de restitution.

### 📦 Logistique et Livraison
- **Photos Preuves & États des lieux** : Intégration de la prise de photo (avant/après montage) 
- **Signature Électronique Sécurisée** : Horodatage certifié et géolocalisation GPS intégrée au moment de la signature du client sur le terminal mobile pour certifier la conformité de la livraison.
- **Mode Offline Résistant (IndexDB)** : Mise en cache complète de l'ensemble des données (itinéraires, équipements, checklists, pièces jointes) via IndexDB et synchronisation transparente en arrière-plan dès la détection de réseau.
- **Guidage GPS Contextuel** : Navigation en un clic vers Google Maps ou Waze avec notification automatique du temps de trajet restant et prévisualisation de la zone de déchargement sur place.

---

## 🤖 Phase 3 : Augmentation par l'Intelligence Artificielle (Long Terme)

L'intégration de modèles d'IA légers et de services cloud pour accélérer la saisie et optimiser la logistique.

### 🎙️ 1. Assistant IA Vocal (Voice-to-Report)
*Saisir un rapport technique sur le terrain avec des gants ou les mains occupées est laborieux.*
- **Fonctionnalité** : Dictée vocale intelligente du rapport technique de fin de mission.
- **Technologie** : Utilisation de modèles Whisper en local (ou API cloud) pour transcrire la voix du technicien. Un LLM (ex: Gemini) analyse ensuite la transcription brute pour en extraire de manière structurée :
  - Les anomalies matérielles (ex: *"projecteur LED #4 cassé"*).
  - Les retours clients (ex: *"le client souhaite une rallonge de 10m en plus la prochaine fois"*).
  - Les heures réelles travaillées.

### 📐 2. Algorithme d'Aide au Chargement Camion (Tetris Logistique)
*Charger un camion de manière optimale nécessite de l'expérience.*
- **Fonctionnalité** : Recommandation de l'ordre physique de chargement des équipements dans le véhicule assigné (Volume/Poids).
- **Technologie** : Un algorithme d'optimisation 3D (Bin Packing) calcule la répartition idéale des caisses et structures dans le camion en fonction des dimensions réelles de chaque équipement. L'IA génère un plan de chargement étape par étape : le matériel de livraison tardive est placé au fond, et celui de la première livraison est placé près des portes.

### 👁️ 3. Analyse Visuelle de Sécurité par Vision (Computer Vision)
*Valider la conformité technique et sécuritaire d'une installation.*
- **Fonctionnalité** : Analyse automatique des photos de montage prises par le technicien.
- **Technologie** : Modèles de reconnaissance visuelle entraînés pour :
  - Détecter les risques de sécurité (ex: passage de câbles non protégés dans les zones publiques, absence de lestage sur un pied de structure).
  - Confirmer la bonne conformité visuelle de l'installation par rapport aux exigences du client.

### 🚦 4. Optimisation Dynamique des Tournées
- **Fonctionnalité** : Ajustement automatique de la planification technique journalière.
- **Technologie** : Analyse des temps de montage passés des techniciens, des conditions météo (ex: pluie impactant la vitesse de montage en extérieur) et des données de trafic historiques pour recalculer et optimiser en temps réel la distribution des missions et les heures d'arrivée prévues.
