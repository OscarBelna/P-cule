// Point d'entrée principal de l'application
// Utilise uniquement les interfaces publiques des modules

import { initNavigation } from './src/ui/NavigationController.js';
import { initDashboard, renderDashboard } from './src/modules/dashboard/index.js';
import { initCalendar, renderCalendar } from './src/modules/calendar/index.js';
import { initTransactionForm, renderTransactions, populateCategorySelect, initRecurrenceModal } from './src/modules/transactions/index.js';
import { updateCategoryColorIndicator } from './src/modules/transactions/TransactionRenderer.js';
import { initGoals, renderGoals } from './src/modules/goals/index.js';
import { initCategoryForm, renderCategories, initCategoryModal, initBackupImport, openCategoryModal } from './src/modules/settings/index.js';
import { loadData, saveData, defaultData } from './src/modules/shared/index.js';
import { initEditTransactionModal } from './src/modules/transactions/TransactionModal.js';

// Exposer les fonctions de rendu globalement pour les callbacks et la navigation
window.renderDashboard = renderDashboard;
window.renderCalendar = renderCalendar;
window.renderTransactions = renderTransactions;
window.renderGoals = renderGoals;
window.renderCategories = renderCategories;
window.populateCategorySelect = populateCategorySelect;
window.openCategoryModal = openCategoryModal;
window.updateCategoryColorIndicator = updateCategoryColorIndicator;

// Callback pour les mises à jour de catégories
window.onCategoryUpdated = () => {
    if (window.renderCategories) window.renderCategories();
    if (window.populateCategorySelect) window.populateCategorySelect();
    if (window.renderGoals) window.renderGoals();
    if (window.renderTransactions) window.renderTransactions();
    if (window.renderDashboard) window.renderDashboard();
};

/**
 * Initialise l'application
 */
function init() {
    // Initialiser la navigation
    initNavigation();

    // Initialiser les modules
    initDashboard();
    initCalendar();
    initTransactionForm();
    initRecurrenceModal();
    initGoals();
    initCategoryForm();
    initCategoryModal();
    initBackupImport();
    initEditTransactionModal();
    
    // Rendu initial
    renderCategories();
    renderTransactions();
    renderCalendar();
    renderDashboard();
    
    // Initialiser les données si elles n'existent pas
    const data = loadData();
    if (data.categories.length === 0 && data.transactions.length === 0 && 
        (!data.goals || (!data.goals.incomeGoal && data.goals.categoryBudgets.length === 0))) {
        saveData(defaultData);
    }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
