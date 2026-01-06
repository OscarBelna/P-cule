# Pécule - Application de Gestion Financière

Pécule est une application web de gestion financière personnelle permettant de suivre vos revenus, dépenses, catégories et objectifs budgétaires. L'application utilise une architecture modulaire basée sur les modules ES6 pour une meilleure maintenabilité et évolutivité.

## 📋 Fonctionnalités

- **Tableau de bord** : Vue d'ensemble avec graphiques (dépenses par catégorie, évolution du solde) et prédictions
- **Calendrier** : Visualisation des transactions par date avec indicateurs visuels
- **Transactions** : Gestion complète des transactions (création, modification, suppression) avec support des transactions récurrentes
- **Objectifs** : Définition d'objectifs de revenus mensuels et budgets par catégorie avec suivi de progression
- **Paramètres** : Gestion des catégories (création, modification, suppression) et sauvegarde/restauration des données

## 🏗️ Architecture

L'application suit une **architecture modulaire** basée sur le pattern **Facade**, où chaque module expose uniquement son interface publique via un fichier `index.js`. Cette approche garantit :

- **Isolation** : Chaque module est indépendant
- **Maintenabilité** : Code organisé par fonctionnalité
- **Testabilité** : Modules testables individuellement
- **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités

### Structure des dossiers

```
P-cule/
├── index.html              # Point d'entrée HTML
├── app.js                  # Point d'entrée JavaScript (orchestration)
├── styles.css              # Styles de l'application
├── src/
│   ├── modules/            # Modules fonctionnels
│   │   ├── dashboard/      # Module Tableau de bord
│   │   ├── calendar/       # Module Calendrier
│   │   ├── transactions/   # Module Transactions
│   │   ├── goals/          # Module Objectifs
│   │   ├── settings/       # Module Paramètres
│   │   └── shared/         # Module partagé (utilitaires communs)
│   └── ui/                 # Contrôleurs d'interface
│       └── NavigationController.js
└── SERVEUR.md              # Instructions pour lancer un serveur
```

## 📦 Modules détaillés

### 1. Module Shared (`src/modules/shared/`)

**Rôle** : Fournit les fonctionnalités communes utilisées par plusieurs modules.

**Fichiers** :
- `StorageService.js` : Gestion du localStorage (loadData, saveData)
- `Formatters.js` : Formatage de devises (formatCurrency) et échappement HTML (escapeHtml)
- `TransactionService.js` : Logique de génération des transactions récurrentes (getAllTransactions)
- `CategoryService.js` : Service générique pour remplir les selects de catégories

**Interface publique** (`index.js`) :
```javascript
export { loadData, saveData, defaultData, STORAGE_KEY }
export { formatCurrency, escapeHtml }
export { getAllTransactions }
export { populateCategorySelect }
```

**Utilisé par** : Tous les autres modules

---

### 2. Module Dashboard (`src/modules/dashboard/`)

**Rôle** : Affiche le tableau de bord avec les KPI, graphiques et prédictions.

**Fichiers** :
- `DashboardController.js` : Initialisation du module
- `DashboardRenderer.js` : Rendu des cartes de résumé et calcul des prédictions
- `DashboardCharts.js` : Création des graphiques Chart.js (camembert des dépenses, évolution du solde)

**Interface publique** (`index.js`) :
```javascript
export { initDashboard, renderDashboard }
```

**Fonctionnalités** :
- Calcul et affichage des totaux (revenus, dépenses, solde) du mois en cours
- Graphique en camembert des dépenses par catégorie
- Graphique linéaire de l'évolution du solde sur 30 jours
- Prédiction du solde de fin de mois basée sur les transactions récurrentes et la moyenne quotidienne

**Dépendances** : `shared` (getAllTransactions, formatCurrency, loadData)

---

### 3. Module Calendar (`src/modules/calendar/`)

**Rôle** : Affiche un calendrier mensuel avec les transactions.

**Fichiers** :
- `CalendarController.js` : Gestion de la navigation (mois précédent/suivant) et état de la date actuelle
- `CalendarRenderer.js` : Rendu du calendrier et affichage des détails d'un jour sélectionné

**Interface publique** (`index.js`) :
```javascript
export { initCalendar, renderCalendar }
```

**Fonctionnalités** :
- Affichage d'un calendrier mensuel avec indicateurs visuels (revenus/dépenses)
- Navigation entre les mois
- Détails des transactions d'un jour sélectionné

**Dépendances** : `shared` (getAllTransactions, loadData, escapeHtml)

---

### 4. Module Transactions (`src/modules/transactions/`)

**Rôle** : Gestion complète des transactions (CRUD).

**Fichiers** :
- `TransactionController.js` : Initialisation du formulaire et gestion de la soumission
- `TransactionRenderer.js` : Rendu de la liste des transactions et remplissage des selects de catégories
- `TransactionModal.js` : Modal d'édition et popup de confirmation de suppression

**Interface publique** (`index.js`) :
```javascript
export { initTransactionForm, renderTransactions, populateCategorySelect }
export { getAllTransactions } // Réexport depuis shared
```

**Fonctionnalités** :
- Création de transactions (revenus/dépenses) avec catégorie, date, description
- Support des transactions récurrentes mensuelles
- Modification de transactions existantes
- Suppression avec confirmation
- Affichage de la liste des transactions (triées par date, plus récentes en premier)

**Dépendances** : `shared`, `settings` (pour ouvrir le modal de catégorie)

---

### 5. Module Goals (`src/modules/goals/`)

**Rôle** : Gestion des objectifs financiers (revenus mensuels et budgets par catégorie).

**Fichiers** :
- `GoalController.js` : Gestion des formulaires (objectif de revenu, budgets par catégorie)
- `GoalRenderer.js` : Affichage des objectifs avec barres de progression

**Interface publique** (`index.js`) :
```javascript
export { initGoals, renderGoals, deleteCategoryBudget }
```

**Fonctionnalités** :
- Définition d'un objectif de revenu mensuel avec suivi de progression
- Création de budgets mensuels par catégorie
- Affichage des barres de progression avec statuts (atteint, attention, dépassé)
- Calcul automatique des dépenses réelles vs budgets

**Dépendances** : `shared` (getAllTransactions, loadData, saveData, formatCurrency, escapeHtml)

---

### 6. Module Settings (`src/modules/settings/`)

**Rôle** : Gestion des catégories et sauvegarde/restauration des données.

**Fichiers** :
- `CategoryController.js` : Gestion du formulaire de catégorie (création, modification, suppression)
- `CategoryRenderer.js` : Affichage de la liste des catégories
- `CategoryModal.js` : Modal de création rapide de catégorie (depuis le formulaire de transaction)
- `BackupController.js` : Export/import des données (JSON et TXT)

**Interface publique** (`index.js`) :
```javascript
export { initCategoryForm, renderCategories, editCategory, deleteCategory }
export { initCategoryModal, openCategoryModal, closeCategoryModal }
export { initBackupImport }
```

**Fonctionnalités** :
- Création, modification et suppression de catégories avec couleurs personnalisées
- Modal de création rapide de catégorie
- Export des données en JSON ou TXT
- Import et restauration des données

**Dépendances** : `shared` (loadData, saveData, escapeHtml)

---

### 7. NavigationController (`src/ui/NavigationController.js`)

**Rôle** : Gère la navigation entre les différentes pages de l'application.

**Fonctionnalités** :
- Gestion des clics sur les éléments de navigation
- Affichage/masquage des pages correspondantes
- Rechargement automatique des données lors du changement de page

**Dépendances** : Aucune (utilise les fonctions globales exposées par app.js)

---

## 🔄 Flux de données

### Communication entre modules

Les modules communiquent uniquement via leurs **interfaces publiques** (fichiers `index.js`). Aucun module ne peut importer directement un fichier interne d'un autre module.

**Exemple** :
```javascript
// ✅ CORRECT - Via l'interface publique
import { loadData, saveData } from '../shared/index.js';

// ❌ INCORRECT - Import direct d'un fichier interne
import { loadData } from '../shared/StorageService.js';
```

### Callbacks globaux

Pour certaines interactions entre modules (comme la mise à jour après création d'une catégorie), l'application utilise des **callbacks globaux** exposés sur `window` :

- `window.onCategoryUpdated` : Appelé après création/modification/suppression d'une catégorie
- `window.renderDashboard`, `window.renderCalendar`, etc. : Fonctions de rendu exposées globalement pour la navigation

### Données partagées

Toutes les données sont stockées dans le **localStorage** via le module `shared/StorageService.js`. La structure des données :

```javascript
{
  categories: [
    { id: string, name: string, color: string }
  ],
  transactions: [
    { 
      id: string, 
      amount: number, // négatif pour dépenses, positif pour revenus
      date: string, // format YYYY-MM-DD
      type: 'income' | 'expense',
      categoryId: string,
      description: string,
      recurrence: 'monthly' | null
    }
  ],
  goals: {
    incomeGoal: number | null,
    categoryBudgets: [
      { id: string, categoryId: string, amount: number }
    ]
  }
}
```

---

## 🚀 Utilisation

### Prérequis

L'application utilise des **modules ES6** qui nécessitent un serveur HTTP. Voir `SERVEUR.md` pour les instructions détaillées.

### Démarrage rapide

1. **Lancer un serveur HTTP** (exemple avec Python) :
   ```bash
   python -m http.server 8000
   ```

2. **Ouvrir dans le navigateur** :
   ```
   http://localhost:8000
   ```

3. **Utiliser l'application** :
   - Créer des catégories dans "Paramètres"
   - Ajouter des transactions dans "Transactions"
   - Visualiser les statistiques dans "Tableau de bord"
   - Définir des objectifs dans "Objectifs"

---

## 📐 Règles d'architecture

### 1. Isolation des modules

Chaque module doit :
- Exposer uniquement son interface publique via `index.js`
- Ne jamais importer directement un fichier interne d'un autre module
- Utiliser le module `shared` pour les fonctionnalités communes

### 2. Code partagé

Toute fonctionnalité utilisée par **2 modules ou plus** doit être placée dans `shared/`.

**Exemples** :
- `formatCurrency()` : utilisé par Dashboard, Goals, Transactions → **Shared**
- `getAllTransactions()` : utilisé par Dashboard, Calendar, Goals, Transactions → **Shared**
- `loadData()` / `saveData()` : utilisé par tous → **Shared**

### 3. Point d'entrée unique

Le fichier `app.js` est le seul point d'entrée de l'application. Il :
- Importe uniquement les interfaces publiques des modules
- Initialise tous les modules
- Expose les fonctions nécessaires globalement (pour les callbacks HTML)

---

## 🔧 Technologies utilisées

- **HTML5** : Structure de l'application
- **CSS3** : Styles et mise en page responsive
- **JavaScript ES6+** : Modules, classes, arrow functions
- **Chart.js** : Graphiques (camembert, ligne)
- **LocalStorage** : Persistance des données côté client

---

## 📝 Structure d'un module type

```
module-name/
├── index.js              # Interface publique (Facade)
├── ModuleController.js   # Logique métier et gestion des événements
├── ModuleRenderer.js     # Rendu et manipulation du DOM
└── (autres fichiers selon les besoins)
```

**Exemple de `index.js`** :
```javascript
// Interface publique du module
export { initModule, renderModule } from './ModuleController.js';
export { updateDisplay } from './ModuleRenderer.js';
```

---

## 🐛 Débogage

### Console du navigateur

Ouvrez la console (F12) pour voir les erreurs éventuelles. Les erreurs courantes :

1. **"Failed to load module"** : Vérifiez que vous utilisez un serveur HTTP (pas file://)
2. **"Cannot find module"** : Vérifiez les chemins d'import (relatifs depuis le fichier)
3. **"is not defined"** : Vérifiez que la fonction est bien exportée dans l'interface publique

### Vérification des données

Les données sont stockées dans le localStorage sous la clé `pecule_data`. Vous pouvez les inspecter dans la console :

```javascript
// Afficher les données
console.log(JSON.parse(localStorage.getItem('pecule_data')));

// Réinitialiser les données
localStorage.removeItem('pecule_data');
```

---

## 🔮 Évolutions futures possibles

L'architecture modulaire facilite l'ajout de nouvelles fonctionnalités :

- **Module Analytics** : Analyses avancées et rapports
- **Module Export** : Export vers CSV, PDF
- **Module Notifications** : Alertes de budget dépassé
- **Module Multi-devices** : Synchronisation cloud
- **Module Recurrence avancée** : Transactions récurrentes hebdomadaires, annuelles

---

## 📄 Licence

Ce projet est un exemple d'architecture modulaire pour application web.

---

## 👤 Auteur

Application développée avec une architecture modulaire basée sur les modules ES6 et le pattern Facade.

