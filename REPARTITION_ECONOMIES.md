# Répartition des Économies - Documentation

## Vue d'ensemble

La fonctionnalité de **Répartition des Économies** vous permet de planifier comment vos économies mensuelles (revenus - dépenses) sont distribuées entre différents objectifs d'épargne.

## Composants

### 1. Graphique Treemap (Tableau de bord)

**Emplacement** : Tableau de bord, à côté du graphique "Économies par mois"

**Fonctionnalités** :
- Visualisation en Treemap (graphique de compartimentage) des économies réparties
- Filtre par mois avec navigation ← →
- Blocs aux coins arrondis (border-radius: 16px)
- Couleurs : Nuances de Vert Sauge (#99BDB4) et Rose Corail (#F2B1A0)
- Affichage des catégories et montants au survol

**Responsive** :
- Desktop : Grid 2 colonnes (Économies + Treemap côte à côte)
- Mobile : Stack vertical

### 2. Interface de Pilotage (Page Objectifs)

**Emplacement** : Page Objectifs, après la section "Budgets par catégorie"

**Fonctionnalités** :
- **Navigation par mois** : Sélecteur avec flèches ← → pour choisir le mois
- **Montant à répartir** : Affiche les économies du mois (Revenus - Dépenses)
- **Reste à répartir** : Mise à jour en temps réel lors de la saisie
- **Inputs d'allocation** : Un champ pour chaque catégorie d'économie
- **Sauvegarde automatique** : Les montants sont enregistrés à chaque modification

**Messages de feedback** :
- ✅ **Reste = 0** : "Bravo ! Chaque euro est à sa place." (couleur Sauge)
- ℹ️ **Économies ≤ 0** : "Ce mois-ci, l'objectif est de stabiliser le budget pour épargner le mois prochain." (couleur Rose Corail)

### 3. Gestion des Catégories d'Économie (Paramètres)

**Emplacement** : Paramètres > Catégories d'Économie

**Fonctionnalités** :
- Section distincte des catégories de transactions
- Formulaire simple : Nom + Couleur uniquement
- Liste des catégories créées avec possibilité de suppression
- Style "Soft Minimalism" avec border-radius: 24px

## Structure des Données

### Modèle de Données

```javascript
{
  categories: [
    {
      id: "123",
      name: "Fond d'urgence",
      color: "#99BDB4",
      type: "savings" // ou "transaction"
    }
  ],
  savingsAllocations: {
    "2025-01": [ // Format année-mois
      { categoryId: "123", amount: 500 },
      { categoryId: "456", amount: 300 }
    ],
    "2025-02": [...]
  }
}
```

## Flux de Travail

1. **Créer des catégories d'économie** dans Paramètres
   - Ex: "Fond d'urgence", "Voyage", "Épargne retraite"

2. **Naviguer vers la page Objectifs**
   - Sélectionner le mois souhaité avec les flèches

3. **Répartir les économies**
   - Voir le montant total à répartir
   - Saisir des montants pour chaque catégorie
   - Observer le "Reste à répartir" se mettre à jour en temps réel

4. **Visualiser sur le Dashboard**
   - Le Treemap affiche la répartition du mois sélectionné
   - Naviguer entre les mois avec les flèches

## Calculs Automatiques

### Économies du mois
```
Économies = Σ(Revenus) - Σ(Dépenses)
```

### Reste à répartir
```
Reste = Économies - Σ(Allocations)
```

## Technologies Utilisées

- **Chart.js 4.4.0** : Bibliothèque de graphiques
- **chartjs-chart-treemap 2.3.0** : Plugin Treemap
- **LocalStorage** : Persistance des données
- **Vanilla JavaScript** : Architecture modulaire
- **CSS Grid/Flexbox** : Layout responsive

## Fichiers Clés

### Nouveaux Fichiers
- `src/modules/dashboard/charts/SavingsTreemapChart.js` - Graphique Treemap

### Fichiers Modifiés
- `src/modules/shared/StorageService.js` - Modèle de données étendu
- `src/modules/dashboard/DashboardRenderer.js` - Intégration Treemap
- `src/modules/goals/GoalRenderer.js` - Interface de répartition
- `src/modules/goals/GoalController.js` - Initialisation contrôles
- `src/modules/settings/CategoryController.js` - Gestion catégories d'économie
- `src/modules/settings/CategoryRenderer.js` - Affichage catégories
- `index.html` - Structure HTML
- `styles.css` - Styles responsive
- `app.js` - Initialisation et synchronisation

## Design - Soft Minimalism

### Couleurs
- **Vert Sauge** : #99BDB4 (primaire)
- **Rose Corail** : #F2B1A0 (CTA et alertes)
- **Cream** : #F2F1E6 (fond)
- **Surface** : #F8F7F2 (cartes)

### Border-radius
- Cards : 24px
- Inputs/Buttons : 12-19px
- Treemap blocks : 16px

### Espacements
- Marges généreuses : 19-38px
- Padding : 12-25px

## Synchronisation Inter-modules

Les modifications dans l'interface de pilotage (Objectifs) mettent automatiquement à jour :
- Le graphique Treemap du Dashboard
- Les données en LocalStorage
- Tous les modules affectés via `window.onCategoryUpdated()`

## Responsive Design

### Desktop (≥ 1024px)
- Grid 2 colonnes pour les graphiques
- Formulaires horizontaux
- Sidebar fixe

### Mobile (< 768px)
- Stack vertical
- Inputs pleine largeur
- Navigation simplifiée

