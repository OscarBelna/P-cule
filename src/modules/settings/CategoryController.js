import { loadData, saveData } from '../shared/index.js';
import { renderCategories, renderSavingsCategories } from './CategoryRenderer.js';

/**
 * Initialise un bouton d'ajout de catégorie
 * @param {string} buttonId - ID du bouton
 * @param {string} type - Type de catégorie ('transaction' ou 'savings')
 * @param {Function} renderCallback - Fonction de rendu à appeler après création
 */
function initAddCategoryButton(buttonId, type, renderCallback) {
    const addBtn = document.getElementById(buttonId);
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.openCategoryModal) {
                window.openCategoryModal(() => {
                    if (renderCallback) renderCallback();
                }, type);
            }
        });
    }
}

/**
 * Initialise le bouton pour créer une catégorie depuis les paramètres
 */
export function initCategoryForm() {
    initAddCategoryButton('settings-add-category-btn', 'transaction', window.renderCategories);
}

/**
 * Initialise le bouton pour créer une catégorie d'économie depuis les paramètres
 */
export function initSavingsCategoryForm() {
    initAddCategoryButton('settings-add-savings-category-btn', 'savings', window.renderSavingsCategories);
}

/**
 * Ouvre le modal d'édition de catégorie
 * @param {string} categoryId - ID de la catégorie à éditer
 * @param {string} type - Type de catégorie ('transaction' ou 'savings')
 * @param {Function} callback - Callback après édition
 */
function openEditCategoryModal(categoryId, type, callback) {
    if (window.openCategoryModal) {
        window.openCategoryModal(callback, type, categoryId);
    }
}

/**
 * Modifie une catégorie d'économie
 */
export function editSavingsCategory(categoryId) {
    openEditCategoryModal(categoryId, 'savings', () => {
        if (window.renderSavingsCategories) window.renderSavingsCategories();
        if (window.renderGoals) window.renderGoals();
    });
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
    
    // Supprimer aussi les allocations associées
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
    if (window.onCategoryUpdated) window.onCategoryUpdated();
    if (window.renderGoals) window.renderGoals();
}

// Exporter pour utilisation globale
window.editSavingsCategory = editSavingsCategory;
window.deleteSavingsCategory = deleteSavingsCategory;

/**
 * Modifie une catégorie
 */
export function editCategory(categoryId) {
    openEditCategoryModal(categoryId, 'transaction', () => {
        if (window.renderCategories) window.renderCategories();
    });
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
    
    // Supprimer aussi les budgets associés
    if (data.goals && data.goals.categoryBudgets) {
        data.goals.categoryBudgets = data.goals.categoryBudgets.filter(b => b.categoryId !== categoryId);
    }
    
    saveData(data);
    renderCategories();
    
    // Notifier les autres modules
    if (window.onCategoryUpdated) window.onCategoryUpdated();
}

// Exporter pour utilisation globale (onclick dans HTML)
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

