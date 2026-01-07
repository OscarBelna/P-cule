import { loadData, saveData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';
import { renderCategories, renderSavingsCategories } from './CategoryRenderer.js';

// Variables d'état
let editingCategoryId = null;

/**
 * Initialise le formulaire de catégorie
 */
export function initCategoryForm() {
    const form = document.getElementById('category-form');
    const cancelBtn = document.getElementById('category-cancel');
    const colorInput = document.getElementById('category-color');
    const colorPreview = document.getElementById('color-preview');

    if (!form || !colorInput || !colorPreview) return;

    // Mise à jour de l'aperçu de couleur
    colorInput.addEventListener('input', (e) => {
        colorPreview.style.backgroundColor = e.target.value;
    });

    // Initialiser l'aperçu de couleur
    colorPreview.style.backgroundColor = colorInput.value;

    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCategorySubmit();
    });

    // Annulation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetCategoryForm();
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
 * Gère la soumission du formulaire de catégorie
 */
export function handleCategorySubmit() {
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const data = loadData();

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }

    if (editingCategoryId !== null) {
        // Modification
        const categoryIndex = data.categories.findIndex(cat => cat.id === editingCategoryId);
        if (categoryIndex !== -1) {
            data.categories[categoryIndex].name = name;
            data.categories[categoryIndex].color = color;
            saveData(data);
            resetCategoryForm();
            renderCategories();
            // Notifier les autres modules via des callbacks globaux
            if (window.onCategoryUpdated) {
                window.onCategoryUpdated();
            }
        }
    } else {
        // Création (toujours type 'transaction' pour cette interface)
        const newCategory = {
            id: Date.now().toString(),
            name: name,
            color: color,
            type: 'transaction'
        };
        data.categories.push(newCategory);
        saveData(data);
        resetCategoryForm();
        renderCategories();
        // Notifier les autres modules
        if (window.onCategoryUpdated) {
            window.onCategoryUpdated();
        }
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
window.deleteSavingsCategory = deleteSavingsCategory;

/**
 * Réinitialise le formulaire de catégorie
 */
export function resetCategoryForm() {
    const form = document.getElementById('category-form');
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const submitBtn = document.getElementById('category-submit');
    const cancelBtn = document.getElementById('category-cancel');
    const formTitle = document.getElementById('category-form-title');
    const colorPreview = document.getElementById('color-preview');

    if (!form) return;

    form.reset();
    if (colorInput) colorInput.value = '#3b82f6';
    if (colorPreview) colorPreview.style.backgroundColor = '#3b82f6';
    editingCategoryId = null;
    if (submitBtn) submitBtn.textContent = 'Ajouter';
    if (formTitle) formTitle.textContent = 'Nouvelle catégorie';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Modifie une catégorie
 */
export function editCategory(categoryId) {
    const data = loadData();
    const category = data.categories.find(cat => cat.id === categoryId);

    if (!category) return;

    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const submitBtn = document.getElementById('category-submit');
    const cancelBtn = document.getElementById('category-cancel');
    const formTitle = document.getElementById('category-form-title');
    const colorPreview = document.getElementById('color-preview');

    if (nameInput) nameInput.value = category.name;
    if (colorInput) colorInput.value = category.color;
    if (colorPreview) colorPreview.style.backgroundColor = category.color;
    editingCategoryId = categoryId;
    if (submitBtn) submitBtn.textContent = 'Modifier';
    if (formTitle) formTitle.textContent = 'Modifier la catégorie';
    if (cancelBtn) cancelBtn.style.display = 'block';

    // Scroll vers le formulaire
    const form = document.getElementById('category-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

