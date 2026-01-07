# 🐷 Pécule - Application de Gestion Financière Personnelle

<div align="center">

**Une application web moderne et intuitive pour gérer vos finances personnelles avec élégance**

[![Design](https://img.shields.io/badge/Design-Soft%20Minimalism-99BDB4?style=flat-square)](README2.md)
[![Architecture](https://img.shields.io/badge/Architecture-Modulaire-ES6-blue?style=flat-square)](README2.md)
[![Responsive](https://img.shields.io/badge/Responsive-Desktop%20%26%20Mobile-green?style=flat-square)](README2.md)

</div>

---

## 📖 Présentation

**Pécule** est une application web de gestion financière personnelle conçue pour vous aider à suivre vos revenus, dépenses et objectifs budgétaires de manière simple et visuelle. L'application allie une interface utilisateur apaisante et moderne à une architecture technique robuste et maintenable.

### ✨ Caractéristiques principales

- 🎨 **Design Soft Minimalism** : Interface épurée avec une palette de couleurs douce et apaisante
- 📱 **100% Responsive** : Optimisée pour desktop et mobile avec navigation adaptative
- 📊 **Tableau de bord interactif** : Graphiques visuels et prédictions intelligentes
- 📅 **Calendrier visuel** : Visualisation des transactions par date avec indicateurs colorés
- 🔄 **Transactions récurrentes** : Automatisation des revenus et dépenses mensuelles
- 🎯 **Objectifs et budgets** : Suivi de progression avec alertes visuelles
- 💰 **Répartition des économies** : Allocation intelligente de vos économies mensuelles par objectifs d'épargne
- 💾 **Sauvegarde locale** : Vos données restent privées sur votre appareil

---

## 🚀 Démarrage rapide

### Prérequis

- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Un serveur HTTP local (l'application utilise des modules ES6)

### Installation

1. **Cloner ou télécharger le projet**

2. **Lancer un serveur HTTP local**

   **Option 1 - Python** :
   ```bash
   python -m http.server 8000
   ```

   **Option 2 - Node.js (http-server)** :
   ```bash
   npx http-server -p 8000
   ```

   **Option 3 - PHP** :
   ```bash
   php -S localhost:8000
   ```

3. **Ouvrir dans le navigateur**
   ```
   http://localhost:8000
   ```

> 📝 **Note** : Consultez `SERVEUR.md` pour des instructions détaillées sur le lancement d'un serveur.

---

## 🎯 Fonctionnalités

### 📊 Tableau de bord

Vue d'ensemble complète de votre situation financière :

- **Cartes de résumé** : Revenus totaux, dépenses totales et solde actuel du mois
- **Graphiques en camembert** : Répartition des dépenses et revenus par catégorie
- **Graphiques d'évolution** : Évolution des dépenses et revenus sur 12 mois
- **Graphique des économies** : Économies mensuelles (revenus - dépenses) sur 12 mois
- **Graphique Treemap** : Répartition visuelle des économies par catégories d'épargne avec navigation mensuelle
- **Graphique linéaire** : Évolution du solde sur les 30 derniers jours
- **Prédiction intelligente** : Estimation du solde de fin de mois basée sur :
  - Les transactions récurrentes restantes
  - La moyenne des dépenses quotidiennes
  - Les revenus récurrents à venir

### 📅 Calendrier

Visualisation mensuelle de vos transactions :

- **Calendrier interactif** : Navigation entre les mois avec indicateurs visuels
- **Indicateurs colorés** : Points de couleur pour identifier revenus (vert) et dépenses (rose)
- **Sélection automatique** : Le jour en cours est automatiquement sélectionné
- **Détails du jour** : Affichage des transactions d'un jour sélectionné avec montants et catégories

### 💰 Transactions

Gestion complète de vos transactions financières :

- **Création rapide** : Formulaire intuitif avec sélection de catégorie
- **Transactions récurrentes** : Configuration de revenus/dépenses mensuels automatiques
- **Modification** : Édition facile de toutes les transactions
- **Suppression sécurisée** : Confirmation avant suppression définitive
- **Historique complet** : Liste triée par date (plus récentes en premier)

### 🎯 Objectifs

Définissez et suivez vos objectifs financiers :

- **Objectif de revenu mensuel** : Fixez un montant cible et suivez votre progression
- **Budgets par catégorie** : Limitez vos dépenses par catégorie avec alertes visuelles
- **Barres de progression** : Visualisation claire de l'avancement avec codes couleur :
  - 🟢 Vert : Objectif atteint
  - 🟠 Orange : Attention, proche de la limite
  - 🔴 Rouge : Budget dépassé

#### 💰 Répartition des Économies (Nouveau)

Pilotez intelligemment l'allocation de vos économies mensuelles :

- **Navigation mensuelle** : Sélecteur de période pour naviguer entre les mois
- **Calcul automatique** : Affichage des économies du mois (Revenus - Dépenses)
- **Formulaire d'allocation** :
  - Sélection de catégorie d'épargne
  - Saisie du montant (validation automatique)
  - Description optionnelle
- **Reste à répartir** : Mise à jour dynamique en temps réel
- **Historique** : Liste des allocations effectuées avec possibilité de suppression
- **Validation intelligente** : Impossible d'allouer plus que les économies disponibles
- **Messages de feedback** :
  - ✅ Succès : "Bravo ! Chaque euro est à sa place." (quand tout est réparti)
  - ℹ️ Info : Message d'encouragement si économies ≤ 0

### ⚙️ Paramètres

Personnalisation et gestion des données :

- **Gestion des catégories de transactions** : Création, modification et suppression avec popup élégant
- **Gestion des catégories d'économie** : Section dédiée pour les objectifs d'épargne
- **Palettes de couleurs** : Choix parmi des palettes prédéfinies (Pastel, Clair, Foncé) ou couleur personnalisée
- **Modal unifié** : Popup réutilisable avec sélecteur de couleurs par onglets
- **Sauvegarde** : Export de toutes vos données en JSON ou TXT
- **Restauration** : Import de sauvegardes pour récupérer vos données

---

## 🎨 Design et Expérience Utilisateur

### Charte graphique "Soft Minimalism"

L'application utilise une palette de couleurs douce et apaisante :

- **Fond principal** : Crème/Beige (#F2F1E6) - Confort visuel
- **Couleur primaire** : Vert Sauge (#99BDB4) - Navigation et éléments structurels
- **Accents** : Rose Corail (#F2B1A0) - Appels à l'action et éléments mis en avant

### Caractéristiques du design

- **Bordures très arrondies** : Border-radius de 24px pour un aspect doux et moderne
- **Ombres subtiles** : Ombres légères pour créer de la profondeur sans agressivité
- **Espacements généreux** : White space abondant pour une lecture aisée
- **Micro-interactions fluides** : Transitions douces (0.3s) et transformations subtiles au survol
- **Typographie élégante** : Polices sans-serif modernes avec hiérarchie visuelle claire

### Responsive Design

- **Desktop (≥1024px)** : Sidebar de navigation fixe, grille de graphiques côte à côte, interface compacte
- **Mobile (<1024px)** : Navigation en bas d'écran, disposition en colonne unique, optimisé pour le tactile

---

## 🏗️ Architecture Technique

### Architecture Modulaire

L'application suit une **architecture modulaire** basée sur le pattern **Facade**, garantissant :

- ✅ **Isolation** : Chaque module est indépendant
- ✅ **Maintenabilité** : Code organisé par fonctionnalité
- ✅ **Testabilité** : Modules testables individuellement
- ✅ **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités

### Structure des modules

```
src/modules/
├── dashboard/      # Tableau de bord et graphiques
├── calendar/       # Calendrier mensuel
├── transactions/   # Gestion des transactions
├── goals/          # Objectifs et budgets
├── settings/       # Catégories et sauvegarde
└── shared/         # Utilitaires communs
```

Chaque module expose uniquement son interface publique via un fichier `index.js`, respectant le principe d'encapsulation.

---

## 💻 Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Styles modernes avec variables CSS et Grid/Flexbox
- **JavaScript ES6+** : Modules, classes, arrow functions
- **Chart.js 4.4.0** : Graphiques interactifs (camembert, ligne, aires)
- **chartjs-chart-treemap 2.3.0** : Visualisation Treemap pour répartition des économies
- **LocalStorage** : Persistance des données côté client

---

## 📱 Compatibilité

- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Navigateurs mobiles (iOS Safari, Chrome Mobile)

---

## 🔒 Confidentialité

**Toutes vos données restent sur votre appareil.** Aucune information n'est envoyée à des serveurs externes. Les données sont stockées localement dans le navigateur via le localStorage.

---

## 📚 Documentation complète

Pour plus de détails sur :
- L'architecture technique détaillée
- Les choix de design et chartes graphiques
- Les particularités de l'implémentation
- Les patterns utilisés

👉 Consultez **[README2.md](README2.md)**

---

## 🤝 Contribution

Cette application est un exemple d'architecture modulaire pour application web. Les contributions sont les bienvenues pour améliorer l'application.

---

## 📄 Licence

Ce projet est un exemple d'architecture modulaire pour application web.

---

<div align="center">

**Développé avec ❤️ en utilisant une architecture modulaire ES6**

</div>
