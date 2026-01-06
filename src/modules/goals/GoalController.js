import { loadData, saveData } from '../shared/index.js';
import { renderGoals } from './GoalRenderer.js';

/**
 * Initialise la page des objectifs
 */
export function initGoals() {
    const incomeGoalForm = document.getElementById('income-goal-form');
    const categoryBudgetForm = document.getElementById('category-budget-form');
    
    if (incomeGoalForm) {
        incomeGoalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleIncomeGoalSubmit();
        });
    }
    
    if (categoryBudgetForm) {
        categoryBudgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCategoryBudgetSubmit();
        });
    }
}

/**
 * Gère la soumission de l'objectif de revenu
 */
function handleIncomeGoalSubmit() {
    const amountInput = document.getElementById('income-goal-amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    const data = loadData();
    if (!data.goals) {
        data.goals = { incomeGoal: null, categoryBudgets: [] };
    }
    data.goals.incomeGoal = amount;
    saveData(data);
    
    if (amountInput) amountInput.value = '';
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
        data.goals = { incomeGoal: null, categoryBudgets: [] };
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

