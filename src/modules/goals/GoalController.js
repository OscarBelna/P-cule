import { loadData, saveData } from '../shared/index.js';
import { renderGoals, initSavingsAllocationControls } from './GoalRenderer.js';

/**
 * Initialise la page des objectifs
 */
export function initGoals() {
    const categoryBudgetForm = document.getElementById('category-budget-form');
    const addSavingsCategoryBtn = document.getElementById('add-savings-category-btn');
    
    // Initialiser les gestionnaires de clic pour l'édition inline des objectifs
    initIncomeGoalCalendarEdit();
    
    if (categoryBudgetForm) {
        categoryBudgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCategoryBudgetSubmit();
        });
    }
    
    // Bouton pour créer rapidement une catégorie d'économie
    if (addSavingsCategoryBtn) {
        addSavingsCategoryBtn.addEventListener('click', () => {
            if (window.openCategoryModal) {
                window.openCategoryModal(() => {
                    // Callback après création : recharger l'interface d'allocation
                    if (window.renderGoals) {
                        window.renderGoals();
                    }
                }, 'savings');
            }
        });
    }
    
    // Initialiser les contrôles de l'allocation des économies
    initSavingsAllocationControls();
}

/**
 * Initialise les gestionnaires de clic pour l'édition inline des objectifs
 */
function initIncomeGoalCalendarEdit() {
    // Utiliser la délégation d'événements pour gérer les clics sur les cases
    document.addEventListener('click', (e) => {
        const monthElement = e.target.closest('.income-goal-calendar-month');
        if (!monthElement) return;
        
        // Ne pas éditer si on clique sur l'input ou le badge
        if (e.target.tagName === 'INPUT' || e.target.classList.contains('income-goal-calendar-month-badge')) {
            return;
        }
        
        const monthKey = monthElement.getAttribute('data-month-key');
        if (!monthKey) return;
        
        // Récupérer le montant actuel
        const currentAmount = parseFloat(monthElement.getAttribute('data-goal-amount')) || 0;
        
        // Remplacer le montant par un input
        const amountElement = monthElement.querySelector('.income-goal-calendar-month-amount');
        if (!amountElement) return;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.min = '0';
        input.value = currentAmount > 0 ? currentAmount.toFixed(2) : '';
        input.className = 'income-goal-calendar-edit-input';
        input.style.cssText = 'width: 100%; padding: 4px; border: 2px solid var(--primary); border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; text-align: center;';
        
        // Remplacer l'élément
        const originalText = amountElement.textContent;
        amountElement.innerHTML = '';
        amountElement.appendChild(input);
        monthElement.classList.add('editing');
        
        // Focus et sélection du texte
        input.focus();
        input.select();
        
        // Sauvegarder au blur ou Enter
        const saveGoal = () => {
            const newAmount = parseFloat(input.value);
            
            if (isNaN(newAmount) || newAmount < 0) {
                // Annuler si valeur invalide
                amountElement.textContent = originalText;
                monthElement.classList.remove('editing');
                return;
            }
            
            // Mettre à jour l'objectif
            updateMonthGoal(monthKey, newAmount);
        };
        
        input.addEventListener('blur', saveGoal);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                amountElement.textContent = originalText;
                monthElement.classList.remove('editing');
            }
        });
    });
}

/**
 * Met à jour l'objectif pour un mois donné
 * @param {string} monthKey - Clé du mois (format: "YYYY-MM")
 * @param {number} amount - Montant de l'objectif
 */
function updateMonthGoal(monthKey, amount) {
    const data = loadData();
    if (!data.goals) {
        data.goals = { incomeGoals: { monthly: {} }, categoryBudgets: [] };
    }
    if (!data.goals.incomeGoals) {
        data.goals.incomeGoals = { monthly: {} };
    }
    if (!data.goals.incomeGoals.monthly) {
        data.goals.incomeGoals.monthly = {};
    }
    
    // Si le montant est 0, supprimer l'entrée
    if (amount === 0) {
        delete data.goals.incomeGoals.monthly[monthKey];
    } else {
        data.goals.incomeGoals.monthly[monthKey] = amount;
    }
    
    saveData(data);
    
    // Re-rendre les objectifs
    renderGoals();
    
    // Notifier le dashboard
    if (window.renderDashboard) {
        window.renderDashboard();
    }
}

/**
 * Gère la soumission d'un budget de catégorie
 */
function handleCategoryBudgetSubmit() {
    const categorySelect = document.getElementById('budget-category');
    const amountInput = document.getElementById('budget-amount');
    
    const categoryId = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!categoryId) {
        alert('Veuillez sélectionner une catégorie');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    const data = loadData();
    if (!data.goals) {
        data.goals = { incomeGoals: { constant: null, monthly: {} }, categoryBudgets: [] };
    }
    
    // Vérifier si le budget existe déjà
    const existingBudgetIndex = data.goals.categoryBudgets.findIndex(b => b.categoryId === categoryId);
    
    if (existingBudgetIndex !== -1) {
        data.goals.categoryBudgets[existingBudgetIndex].amount = amount;
    } else {
        data.goals.categoryBudgets.push({
            id: Date.now().toString(),
            categoryId: categoryId,
            amount: amount
        });
    }
    
    saveData(data);
    
    const form = document.getElementById('category-budget-form');
    if (form) form.reset();
    
    renderGoals();
    // Notifier le dashboard
    if (window.renderDashboard) {
        window.renderDashboard();
    }
}

/**
 * Supprime un budget de catégorie
 */
export function deleteCategoryBudget(budgetId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
        return;
    }
    
    const data = loadData();
    if (data.goals && data.goals.categoryBudgets) {
        data.goals.categoryBudgets = data.goals.categoryBudgets.filter(b => b.id !== budgetId);
        saveData(data);
        renderGoals();
        // Notifier le dashboard
        if (window.renderDashboard) {
            window.renderDashboard();
        }
    }
}

// Exporter pour utilisation globale (onclick dans HTML)
window.deleteCategoryBudget = deleteCategoryBudget;
