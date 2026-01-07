# 📘 Pécule - Documentation Technique Complète

## Table des matières

1. [Charte Graphique et Design](#charte-graphique-et-design)
2. [Architecture Technique Détaillée](#architecture-technique-détaillée)
3. [Choix de Design et Justifications](#choix-de-design-et-justifications)
4. [Particularités de l'Implémentation](#particularités-de-limplémentation)
5. [Responsive Design](#responsive-design)
6. [Accessibilité](#accessibilité)
7. [Performance et Optimisations](#performance-et-optimisations)

---

## 🎨 Charte Graphique et Design

### Palette de Couleurs "Soft Minimalism"

L'application utilise une palette de couleurs douce et apaisante, inspirée du minimalisme organique :

#### Couleurs principales

```css
/* Fond et Surfaces */
--background: #F2F1E6        /* Cream/Beige - Fond principal */
--surface: #F8F7F2          /* Variation légèrement plus claire pour les cartes */
--surface-elevated: #FFFFFF  /* Blanc pour éléments élevés */

/* Couleur Primaire / Accents */
--primary: #99BDB4           /* Vert Sauge - Navigation, icônes, éléments structurels */
--primary-dark: #7FA89D      /* Variation plus foncée pour hover */
--primary-light: #B5D3CC     /* Variation plus claire */

/* Appels à l'action (CTA) */
--cta: #F2B1A0               /* Rose Corail - Boutons importants et éléments mis en avant */
--cta-dark: #E89A85          /* Variation plus foncée pour hover */
--cta-light: #F8C9BB         /* Variation plus claire */

/* Texte */
--text-primary: #2C2C2C      /* Gris foncé pour contraste optimal (WCAG AA) */
--text-secondary: #6B6B6B    /* Gris moyen pour texte secondaire */
--text-tertiary: #9A9A9A     /* Gris clair pour texte tertiaire */

/* États */
--success: #7FA89D           /* Adapté à la palette - vert sauge pour succès */
--danger: #D4A5A0            /* Adapté à la palette - rose corail assombri pour danger */
--warning: #E8B89A           /* Ton chaud pour les avertissements */
```

#### Justification des couleurs

- **Cream/Beige (#F2F1E6)** : Couleur apaisante qui réduit la fatigue visuelle, idéale pour une application financière utilisée régulièrement
- **Vert Sauge (#99BDB4)** : Évoque la croissance et la stabilité financière, couleur naturelle et rassurante
- **Rose Corail (#F2B1A0)** : Crée un contraste doux pour les actions importantes sans être agressif, évoque la chaleur et l'approche humaine

### Système de Design

#### Border-radius

```css
--radius: 24px        /* Cartes principales */
--radius-sm: 16px     /* Boutons, champs de formulaire */
--radius-lg: 32px     /* Modals, sidebar */
--radius-full: 9999px /* Éléments circulaires */
```

**Justification** : Les bordures très arrondies créent un sentiment de douceur et d'approche humaine, réduisant l'aspect "technique" de l'application.

#### Ombres (Soft Shadows)

```css
--shadow-sm: 0 2px 4px 0 rgba(0, 0, 0 / 0.03)
--shadow-md: 0 4px 8px -2px rgba(0, 0, 0 / 0.05), 0 2px 4px -1px rgba(0, 0, 0 / 0.03)
--shadow-lg: 0 8px 16px -4px rgba(0, 0, 0 / 0.06), 0 4px 8px -2px rgba(0, 0, 0 / 0.04)
```

**Justification** : Ombres très subtiles (opacité 3-6%) pour créer de la profondeur sans alourdir visuellement l'interface.

#### Espacements (White Space)

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

**Justification** : Espacements généreux pour améliorer la lisibilité et créer une sensation d'aisance visuelle.

#### Typographie

- **Famille de polices** : `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Inter', sans-serif`
- **Line-height** : 1.7 (généreux pour la lisibilité)
- **Letter-spacing** : -0.01em à -0.02em (légèrement resserré pour un aspect moderne)
- **Hiérarchie** :
  - H1 : 32px (mobile) / 24px (desktop)
  - H2 : 22px (mobile) / 18px (desktop)
  - H3 : 18px (mobile) / 16px (desktop)

**Justification** : Utilisation des polices système pour des performances optimales et une cohérence avec l'OS de l'utilisateur.

---

## 🏗️ Architecture Technique Détaillée

### Pattern Architectural : Facade Modulaire

L'application utilise le pattern **Facade** au niveau de chaque module :

```
Module/
├── index.js              # Facade - Interface publique uniquement
├── ModuleController.js   # Logique métier (privé)
├── ModuleRenderer.js     # Rendu DOM (privé)
└── Autres fichiers...   # Implémentation interne (privé)
```

#### Principes

1. **Encapsulation stricte** : Aucun module ne peut importer directement un fichier interne d'un autre module
2. **Interface publique unique** : Chaque module expose uniquement ce qui est nécessaire via `index.js`
3. **Dépendances explicites** : Toutes les dépendances sont déclarées dans l'interface publique

#### Exemple concret

```javascript
// ✅ CORRECT - Via l'interface publique
import { loadData, saveData } from '../shared/index.js';

// ❌ INCORRECT - Import direct d'un fichier interne
import { loadData } from '../shared/StorageService.js';
```

### Structure des Modules

#### Module Shared

**Rôle** : Fournit les fonctionnalités communes utilisées par tous les modules.

**Fichiers** :
- `StorageService.js` : Gestion du localStorage avec structure de données typée
- `Formatters.js` : Formatage de devises (formatCurrency) et échappement HTML (escapeHtml)
- `TransactionService.js` : Logique de génération des transactions récurrentes (getAllTransactions)
- `CategoryService.js` : Service générique pour remplir les selects de catégories

**Pourquoi centralisé** : Évite la duplication de code et garantit la cohérence des données à travers l'application.

#### Module Dashboard

**Rôle** : Affiche le tableau de bord avec KPI, graphiques et prédictions.

**Particularités** :
- **Ajustement automatique des tailles** : Les cartes de résumé s'adaptent automatiquement si le montant est trop long (réduction progressive de l'icône puis du texte)
- **Prédiction intelligente** : Calcul basé sur les transactions récurrentes, la moyenne quotidienne et les jours restants
- **Graphiques Chart.js** : Configuration personnalisée avec la palette de couleurs de l'application

**Dépendances** : `shared` (getAllTransactions, formatCurrency, loadData)

#### Module Calendar

**Rôle** : Affiche un calendrier mensuel interactif avec les transactions.

**Particularités** :
- **Sélection automatique** : Le jour en cours est automatiquement sélectionné au chargement
- **Affichage automatique** : Les transactions du jour en cours s'affichent sans interaction
- **Adaptation au zoom** : Utilisation de `aspect-ratio` et gaps relatifs pour s'adapter au zoom navigateur
- **Indicateurs visuels** : Points de couleur pour identifier rapidement revenus et dépenses

**Dépendances** : `shared` (getAllTransactions, loadData, escapeHtml)

#### Module Transactions

**Rôle** : Gestion complète des transactions (CRUD).

**Particularités** :
- **Transactions récurrentes** : Génération automatique des transactions mensuelles basée sur les transactions originales
- **Modal d'édition** : Interface dédiée pour modifier les transactions
- **Popup de confirmation** : Sécurité avant suppression définitive
- **Synchronisation** : Mise à jour automatique de tous les modules après modification

**Dépendances** : `shared`, `settings` (pour ouvrir le modal de catégorie)

#### Module Goals

**Rôle** : Gestion des objectifs financiers (revenus mensuels et budgets par catégorie).

**Particularités** :
- **Barres de progression dynamiques** : Calcul automatique avec codes couleur selon l'état
- **Statuts visuels** : Success (vert), Warning (orange), Danger (rouge)
- **Calculs en temps réel** : Mise à jour automatique lors de l'ajout de transactions

**Dépendances** : `shared` (getAllTransactions, loadData, saveData, formatCurrency, escapeHtml)

#### Module Settings

**Rôle** : Gestion des catégories et sauvegarde/restauration des données.

**Particularités** :
- **Palettes de couleurs prédéfinies** : Pastel, Clair, Foncé avec génération automatique
- **Sélecteur de couleur personnalisé** : Input color natif pour choix libre
- **Export multiple** : JSON (structuré) et TXT (lisible) pour différents besoins
- **Import sécurisé** : Validation avant restauration des données

**Dépendances** : `shared` (loadData, saveData, escapeHtml)

---

## 🎯 Choix de Design et Justifications

### Pourquoi "Soft Minimalism" ?

1. **Réduction du stress visuel** : Les couleurs douces et les espacements généreux créent un environnement apaisant pour gérer ses finances
2. **Focus sur le contenu** : Le minimalisme met l'accent sur les données financières plutôt que sur l'interface
3. **Approche humaine** : Les formes arrondies et les couleurs organiques évoquent la chaleur et l'approche humaine
4. **Professionnalisme doux** : Équilibre entre sérieux financier et accessibilité

### Navigation Adaptative

#### Desktop : Sidebar

**Pourquoi une sidebar sur desktop ?**

- **Efficacité spatiale** : Utilise l'espace vertical disponible sur les grands écrans
- **Navigation toujours visible** : Accès constant aux différentes sections
- **Cohérence visuelle** : La couleur Sauge crée une identité visuelle forte
- **Largeur optimisée** : 240px (compacte mais confortable)

#### Mobile : Bottom Navigation

**Pourquoi une navigation en bas sur mobile ?**

- **Accessibilité tactile** : Zone facilement accessible avec le pouce
- **Standard mobile** : Conforme aux conventions UX mobiles
- **Visibilité** : Toujours visible même lors du scroll
- **5 onglets optimisés** : Taille adaptée pour 5 éléments sans surcharge

### Layout Responsive

#### Desktop (≥1024px)

- **Grille de graphiques** : 2 colonnes pour visualisation côte à côte
- **Cartes de résumé** : 3 colonnes sur une ligne
- **Largeur maximale** : Aucune limite (utilise toute la largeur disponible)
- **Calendrier centré** : Largeur maximale de 750px pour lisibilité optimale

**Justification** : Sur desktop, l'espace horizontal permet d'afficher plus d'informations simultanément, améliorant la vue d'ensemble.

#### Mobile (<1024px)

- **Disposition en colonne** : Tous les éléments empilés verticalement
- **Largeur adaptative** : S'adapte à la largeur de l'écran
- **Touch-friendly** : Tailles de boutons et espacements optimisés pour le tactile

**Justification** : Sur mobile, la priorité est à la lisibilité et à l'accessibilité tactile, d'où la disposition verticale.

### Micro-interactions

#### Transitions

- **Durée standard** : 0.3s (var(--transition-base))
- **Easing** : `ease` (accélération et décélération douces)
- **Transformations** : `translateY(-2px)` au hover pour feedback visuel subtil

**Justification** : Transitions suffisamment rapides pour la réactivité mais assez lentes pour être perçues, créant un sentiment de fluidité.

#### Animations

- **FadeIn** : Apparition progressive des éléments (opacité + translation)
- **ScaleIn** : Agrandissement progressif pour les cartes
- **SlideUp** : Montée depuis le bas pour les modals

**Justification** : Animations discrètes qui guident l'attention sans distraire.

---

## 🔧 Particularités de l'Implémentation

### Système d'Ajustement Automatique des Tailles

**Problème résolu** : Les montants dans les cartes de résumé peuvent dépasser si trop longs.

**Solution** : Fonction `adjustSummaryCardsSizes()` qui :

1. **Détecte le débordement** : Vérifie si le contenu dépasse de la carte
2. **Réduit progressivement l'icône** : De 36px à 20px minimum (par pas de 2px)
3. **Réduit le texte si nécessaire** : De 22px à 16px minimum (par pas de 1px) si l'icône est déjà à sa taille minimale
4. **S'adapte au redimensionnement** : Se relance automatiquement lors du resize de la fenêtre

**Code clé** :
```javascript
// Forcer le recalcul du layout (lecture synchrone)
const _ = card.offsetHeight;
```

**Pourquoi cette approche** : Force le navigateur à recalculer le layout de manière synchrone, permettant de vérifier immédiatement si le contenu rentre.

### Transactions Récurrentes

**Implémentation** : Génération dynamique des transactions récurrentes à partir des transactions originales.

**Logique** :
1. Les transactions originales avec `recurrence: 'monthly'` sont stockées
2. `getAllTransactions()` génère automatiquement les transactions pour chaque mois
3. Les transactions générées ont un flag `isRecurring: true` et `originalId` pour les identifier
4. Seules les transactions originales peuvent être modifiées/supprimées

**Pourquoi cette approche** :
- **Flexibilité** : Permet de modifier/supprimer la récurrence sans affecter les transactions passées
- **Performance** : Génération à la volée plutôt que stockage de toutes les transactions futures
- **Simplicité** : Une seule transaction à gérer pour une récurrence infinie

### Gestion du Zoom Navigateur

**Problème résolu** : Le calendrier ne s'adaptait pas correctement au zoom/dézoom.

**Solution** :
- **Gaps relatifs** : Utilisation de pourcentages (0.5%, 0.6%, 0.8%) au lieu de pixels fixes
- **Aspect-ratio** : Utilisation de `aspect-ratio: 1` qui s'adapte naturellement au zoom
- **Grid auto-rows** : `grid-auto-rows: minmax(0, 1fr)` pour adaptation flexible

**Pourquoi cette approche** : Les unités relatives (%, vw, fr) s'adaptent automatiquement au zoom du navigateur, contrairement aux pixels fixes.

### Scroll Automatique

**Problème résolu** : La page descendait automatiquement lors de l'affichage des détails du jour.

**Solution** :
1. Suppression de `scrollIntoView` dans `showDayDetails()`
2. Ajout de `window.scrollTo({ top: 0, behavior: 'instant' })` lors du changement de page

**Pourquoi** : L'utilisateur doit contrôler le scroll, pas l'application. Le scroll automatique peut être désorientant.

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First */
Base styles          : < 768px
Tablette            : ≥ 768px
Desktop             : ≥ 1024px
```

**Justification** : Approche mobile-first pour garantir que l'application fonctionne sur tous les appareils, puis amélioration progressive pour les écrans plus grands.

### Navigation Adaptative

#### Desktop (≥1024px)

```css
.sidebar-nav {
    display: flex;
    width: 240px;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
}

.main-content {
    margin-left: 240px;
}

.bottom-nav {
    display: none;
}
```

#### Mobile (<1024px)

```css
.sidebar-nav {
    display: none;
}

.main-content {
    margin-left: 0;
    padding-bottom: 70px; /* Espace pour bottom nav */
}

.bottom-nav {
    display: flex;
}
```

### Grille de Dashboard

#### Desktop

```css
.summary-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
}

.charts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
}
```

#### Mobile

```css
.summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
}

.charts-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
}
```

---

## ♿ Accessibilité

### Contraste WCAG AA

Tous les contrastes respectent les normes WCAG AA (minimum 4.5:1 pour le texte normal) :

- **Texte primaire (#2C2C2C) sur fond Cream (#F2F1E6)** : Ratio de 12.6:1 ✅
- **Texte sur fond Sauge (#99BDB4)** : Utilisation de blanc avec opacité ajustée pour contraste optimal
- **Texte sur fond Rose Corail (#F2B1A0)** : Utilisation de texte foncé (#2C2C2C) pour contraste suffisant

### États Focus

Tous les éléments interactifs ont des états `:focus-visible` visibles :

```css
.btn:focus-visible {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
}
```

**Justification** : Permet la navigation au clavier avec feedback visuel clair.

### Navigation Clavier

- **Tab** : Navigation entre les éléments interactifs
- **Entrée/Espace** : Activation des boutons
- **Flèches** : Navigation dans le calendrier (à implémenter si nécessaire)

### Labels et ARIA

- Tous les formulaires ont des labels associés
- Les boutons ont des textes descriptifs
- Les icônes sont accompagnées de texte

---

## ⚡ Performance et Optimisations

### LocalStorage

**Stratégie** : Stockage local uniquement, pas de synchronisation serveur.

**Avantages** :
- **Performance** : Accès instantané aux données
- **Confidentialité** : Données restent sur l'appareil
- **Hors ligne** : Fonctionne sans connexion

**Limitations** :
- Limite de ~5-10MB selon le navigateur
- Données perdues si cache nettoyé (d'où l'export/import)

### Chart.js

**Configuration** :
- **Responsive** : `responsive: true`
- **MaintainAspectRatio** : `false` pour contrôle total de la hauteur
- **Lazy loading** : Graphiques créés uniquement quand la page est active

**Optimisation** : Destruction des graphiques existants avant création de nouveaux pour éviter les fuites mémoire.

### Rendu Conditionnel

Les modules ne rendent que lorsque nécessaire :

```javascript
// Exemple : Dashboard ne se rend que si la page est active
if (targetPage === 'dashboard') {
    if (window.renderDashboard) window.renderDashboard();
}
```

**Justification** : Évite les calculs inutiles et améliore les performances.

### CSS Variables

Utilisation extensive de variables CSS pour :

- **Performance** : Calculs CSS natifs plutôt que JavaScript
- **Maintenabilité** : Modification centralisée de la palette
- **Thématisation future** : Facilite l'ajout de thèmes

---

## 🎨 Détails de l'Interface

### Cartes (Cards)

**Caractéristiques** :
- Fond : `var(--surface)` avec légère variation pour profondeur
- Border-radius : 24px
- Ombre : `var(--shadow-sm)` avec élévation au hover
- Padding : `var(--spacing-lg)` (mobile) / `var(--spacing-md) var(--spacing-lg)` (desktop)

**Effet hover** :
```css
.card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}
```

### Boutons

**Hiérarchie** :
- **Primaire (CTA)** : Rose Corail (#F2B1A0) pour actions principales
- **Secondaire** : Vert Sauge clair pour actions secondaires
- **Danger** : Rose Corail assombri pour actions destructives

**Effet ripple** : Animation de vague au clic via `::before` pseudo-element.

### Formulaires

**Caractéristiques** :
- Bordures : 2px (plus visibles que 1px)
- Focus : Ombre colorée avec la couleur primaire
- Labels : Font-weight 600 pour hiérarchie claire

**Focus state** :
```css
input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(153, 189, 180, 0.15);
    background: white;
}
```

### Modals

**Caractéristiques** :
- Backdrop blur : `backdrop-filter: blur(4px)` pour effet de profondeur
- Animation : SlideUp depuis le bas
- Border-radius : 32px pour douceur maximale
- Max-width : 500px (mobile) / 600px (desktop)

---

## 🔄 Flux de Données

### Structure des Données

```javascript
{
  categories: [
    { 
      id: string,           // UUID
      name: string,         // Nom de la catégorie
      color: string         // Code hexadécimal (#RRGGBB)
    }
  ],
  transactions: [
    { 
      id: string,           // UUID
      amount: number,       // Négatif pour dépenses, positif pour revenus
      date: string,         // Format YYYY-MM-DD
      categoryId: string,   // Référence à une catégorie
      description: string,  // Description optionnelle
      recurrence: string | null,  // 'monthly' | null
      originalId: string | undefined  // Pour transactions récurrentes générées
    }
  ],
  goals: {
    incomeGoal: number | null,  // Objectif de revenu mensuel
    categoryBudgets: [
      { 
        id: string,         // UUID
        categoryId: string, // Référence à une catégorie
        amount: number      // Budget mensuel
      }
    ]
  }
}
```

### Cycle de Vie des Données

1. **Chargement** : `loadData()` depuis localStorage au démarrage
2. **Modification** : Modification en mémoire puis `saveData()`
3. **Synchronisation** : Tous les modules se re-rendent via callbacks globaux
4. **Persistance** : Sauvegarde automatique à chaque modification

### Callbacks Globaux

Pour éviter les dépendances circulaires, certains callbacks sont exposés globalement :

```javascript
window.onCategoryUpdated = () => {
    renderCategories();
    populateCategorySelect();
    renderGoals();
    renderTransactions();
    renderDashboard();
};
```

**Justification** : Permet à un module (Settings) de notifier les autres sans créer de dépendances.

---

## 🛠️ Technologies et Bibliothèques

### Chart.js 4.4.0

**Utilisation** :
- Graphique en camembert (doughnut) pour dépenses par catégorie
- Graphique linéaire (line) pour évolution du solde

**Configuration personnalisée** :
- Couleurs harmonisées avec la palette de l'application
- Tooltips stylisés avec la charte graphique
- Légendes adaptées avec polices et couleurs cohérentes

**Pourquoi Chart.js** :
- **Mature** : Bibliothèque stable et bien maintenue
- **Flexible** : Configuration très personnalisable
- **Performant** : Rendu Canvas optimisé
- **Accessible** : Support des lecteurs d'écran

### Modules ES6

**Avantages** :
- **Encapsulation** : Scope isolé par fichier
- **Tree-shaking** : Import uniquement de ce qui est nécessaire
- **Maintenabilité** : Dépendances explicites
- **Standards** : Support natif dans les navigateurs modernes

**Limitation** : Nécessite un serveur HTTP (pas de `file://`)

---

## 📊 Métriques et Optimisations Futures

### Optimisations Possibles

1. **Lazy loading des modules** : Charger les modules uniquement quand nécessaires
2. **Virtual scrolling** : Pour les longues listes de transactions
3. **Service Worker** : Pour fonctionnement hors ligne complet
4. **IndexedDB** : Pour stockage de grandes quantités de données
5. **Compression** : Minification CSS/JS pour production

### Améliorations UX Possibles

1. **Recherche** : Recherche dans les transactions
2. **Filtres avancés** : Filtrage par date, catégorie, montant
3. **Graphiques supplémentaires** : Tendances annuelles, comparaisons
4. **Notifications** : Alertes de budget dépassé
5. **Thèmes** : Mode sombre, thèmes personnalisés

---

## 🎓 Patterns et Bonnes Pratiques

### Separation of Concerns

- **Controller** : Logique métier et gestion des événements
- **Renderer** : Manipulation du DOM et affichage
- **Service** : Logique réutilisable (Shared)

### Single Responsibility Principle

Chaque module a une responsabilité unique et bien définie :
- Dashboard : Affichage des statistiques
- Calendar : Visualisation calendaire
- Transactions : Gestion CRUD des transactions
- Goals : Gestion des objectifs
- Settings : Configuration

### DRY (Don't Repeat Yourself)

Toute fonctionnalité utilisée par 2+ modules est dans `shared/` :
- Formatage de devises
- Gestion du storage
- Génération de transactions récurrentes

### Encapsulation

Aucun module ne peut accéder directement aux fichiers internes d'un autre module. Communication uniquement via interfaces publiques.

---

## 📝 Conclusion

Pécule est une application qui allie :

- **Design moderne et apaisant** : Charte graphique "Soft Minimalism" pour une expérience utilisateur agréable
- **Architecture robuste** : Pattern Facade modulaire pour maintenabilité et évolutivité
- **Responsive complet** : Adaptation fluide de mobile à desktop
- **Accessibilité** : Respect des normes WCAG AA
- **Performance** : Optimisations pour réactivité et fluidité

Cette architecture permet une évolution future facilitée et une maintenance simplifiée, tout en offrant une expérience utilisateur de qualité professionnelle.

---

<div align="center">

**Documentation technique complète de Pécule**

*Dernière mise à jour : 2024*

</div>

