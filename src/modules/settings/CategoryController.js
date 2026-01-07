import { loadData, saveData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';
import { renderCategories, renderSavingsCategories } from './CategoryRenderer.js';


/**
 * Initialise le bouton pour créer une catégorie depuis les paramètres
 */
export function initCategoryForm() {
    const addBtn = document.getElementById('settings-add-category-btn');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.openCategoryModal) {
                window.openCategoryModal(() => {
                    if (window.renderCategories) {
                        window.renderCategories();
                    }
                }, 'transaction');
            }
        });
    }
}

/**
 * Initialise le bouton pour créer une catégorie d'économie depuis les paramètres
 */
export function initSavingsCategoryForm() {
    const addBtn = document.getElementById('settings-add-savings-category-btn');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.openCategoryModal) {
                window.openCategoryModal(() => {
                    if (window.renderSavingsCategories) {
                        window.renderSavingsCategories();
                    }
                }, 'savings');
            }
        });
    }
}


/**
 * Modifie une catégorie d'économie
 */
export function editSavingsCategory(categoryId) {
    if (window.openCategoryModal) {
        window.openCategoryModal(() => {
            if (window.renderSavingsCategories) {
                window.renderSavingsCategories();
            }
            if (window.renderGoals) {
                window.renderGoals();
            }
        }, 'savings', categoryId);
    }
}

/**
 * Supprime une catégorie d'économie
 */
export function deleteSavingsCategory(categoryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie d\'économie ?')) {
        return;
    }

    const data = loadData();
    data.categories = data.categories.filter(cat => cat.id !== categoryId);
    
    // Supprimer aussi les allocations associées (si elles existent)
    if (data.savingsAllocations) {
        Object.keys(data.savingsAllocations).forEach(monthKey => {
            data.savingsAllocations[monthKey] = data.savingsAllocations[monthKey].filter(
                a => a.categoryId !== categoryId
            );
        });
    }
    
    saveData(data);
    renderSavingsCategories();
    
    // Notifier les autres modules
    if (window.onCategoryUpdated) {
        window.onCategoryUpdated();
    }
    if (window.renderGoals) {
        window.renderGoals();
    }
}

// Exporter pour utilisation globale
window.editSavingsCategory = editSavingsCategory;
window.deleteSavingsCategory = deleteSavingsCategory;


/**
 * Modifie une catégorie
 */
export function editCategory(categoryId) {
    if (window.openCategoryModal) {
        window.openCategoryModal(() => {
            if (window.renderCategories) {
                window.renderCategories();
            }
        }, 'transaction', categoryId);
    }
}

/**
 * Supprime une catégorie
 */
export function deleteCategory(categoryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        return;
    }

    const data = loadData();
    data.categories = data.categories.filter(cat => cat.id !== categoryId);
    
    // Supprimer aussi les budgets associés à cette catégorie
    if (data.goals && data.goals.categoryBudgets) {
        data.goals.categoryBudgets = data.goals.categoryBudgets.filter(b => b.categoryId !== categoryId);
    }
    
    saveData(data);
    renderCategories();
    // Notifier les autres modules
    if (window.onCategoryUpdated) {
        window.onCategoryUpdated();
    }
}

// Exporter pour utilisation globale (onclick dans HTML)
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

