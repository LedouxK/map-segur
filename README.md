# Carte Interactive des Franchises SEGUR

## 📋 Vue d'ensemble
Ce projet est une application web interactive qui affiche une carte de France avec les différentes franchises SEGUR. L'application permet aux utilisateurs de visualiser et d'interagir avec les différentes localisations des franchises sur la carte.

## 🎯 Fonctionnalités principales

### 1. Affichage de la carte
- ✅ Carte de France interactive avec D3.js
- ✅ Marqueurs pour chaque franchise
- ✅ Zoom et déplacement fluides
- ✅ Adaptation responsive de la carte

### 2. Liste des franchises
- ✅ Panel latéral avec liste des franchises
- ✅ Bouton "AFFICHER" pour chaque franchise
- ✅ Design moderne avec effets de survol
- ✅ Affichage du nom SEGUR et de la ville

### 3. Contrôles de navigation
- ✅ Boutons de zoom (+/-)
- ✅ Bouton de réinitialisation (⌂)
- ✅ Bouton d'information (i)
- ✅ Raccourcis clavier et souris

### 4. Panel de détails
- ✅ Affichage des informations détaillées de chaque franchise
- ✅ Support pour les équipes multiples (onglets)
- ✅ Informations de contact
- ✅ Liste des départements couverts

### 5. Interactions carte
- ✅ Mise en évidence des départements au survol
- ✅ Coloration des départements rattachés à chaque franchise
- ✅ Animation fluide des transitions
- ✅ Interaction depuis le point ou le nom de la ville

## 🔧 Structure technique

### Architecture des fichiers
- `index.html` : Structure principale
- `map.js` : Logique de la carte et interactions
- `style.css` : Styles généraux
- `map.css` : Styles spécifiques à la carte
- `markers.css` : Styles des marqueurs
- `data/franchises.js` : Données des franchises
- `data/departements.json` : Données géographiques des départements
- `data/fra2021.json` : Contours de la France

### Technologies utilisées
- D3.js v7 pour la cartographie
- JavaScript vanilla
- CSS3 avec Flexbox
- HTML5

## 🚀 Pistes d'amélioration

### 1. Performance
- [ ] Optimisation du chargement initial
- [ ] Mise en cache des données de la carte
- [ ] Lazy loading des images

### 2. Fonctionnalités à venir
- [ ] Recherche de franchises
- [ ] Filtrage par département
- [ ] Mode sombre complet
- [ ] Export des informations

### 3. UX/UI
- [ ] Tooltips au survol des marqueurs
- [ ] Amélioration de l'accessibilité
- [ ] Messages de chargement/erreur

### 4. Mobile
- [ ] Optimisation tactile
- [ ] Mode hors ligne
- [ ] Installation PWA
- [ ] Gestes de navigation

## 📱 Compatibilité

L'application est responsive et s'adapte à différentes tailles d'écran :
- Desktop (> 1200px)
- Tablette (768px - 1200px)
- Mobile (< 768px)

## 🔒 Sécurité et données

- Protection des données personnelles
- Validation des entrées utilisateur
- Format normalisé des données (téléphones, codes départements)

## 📈 Évolutions futures

1. **Backend**
   - API REST pour la gestion des données
   - Base de données pour les franchises
   - Système d'authentification

2. **Frontend**
   - Migration possible vers React/Vue
   - Gestion d'état global
   - Système de routage

3. **Fonctionnel**
   - Espace administrateur
   - Statistiques d'utilisation
   - Système de notifications

## 🎨 Design

Le design suit la charte graphique SEGUR :
- Couleur principale : #e31e26 (rouge SEGUR)
- Interface épurée et moderne
- Animations fluides
- Design responsive et adaptatif