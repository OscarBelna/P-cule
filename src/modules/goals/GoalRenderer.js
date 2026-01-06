import { loadData } from '../shared/index.js';
import { getAllTransactions } from '../shared/index.js';
import { formatCurrency, escapeHtml } from '../shared/index.js';

/**
 * Affiche la page des objectifs
 */
export function renderGoals() {
    const data = loadData();
    const goals = data.goals || { incomeGoal: null, categoryBudgets: [] };
    
    // Afficher l'objectif de revenu
    renderIncomeGoal(goals.incomeGoal);
    
    // Afficher les budgets par catégorie
    renderCategoryBudgets(goals.categoryBudgets || []);
    
    // Remplir le select des catégories
    populateBudgetCategorySelect();
}

/**
 * Remplit le select des catégories pour les budgets
 */
function populateBudgetCategorySelect() {
    const select = document.getElementById('budget-category');
    if (!select) return;
    
    const data = loadData();
    
    select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
    
    data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        // Utiliser uniquement le nom de la catégorie
        option.textContent = category.name;
        
        // Indiquer si la catégorie a déjà un budget
        const existingBudget = data.goals?.categoryBudgets?.find(b => b.categoryId === category.id);
        if (existingBudget) {
            option.textContent += ` (Budget: ${formatCurrency(existingBudget.amount)})`;
        }
        
        // Colorer le texte de l'option avec la couleur de la catégorie
        option.style.color = category.color;
        
        select.appendChild(option);
    });
}

/**
 * Affiche l'objectif de revenu avec la barre de progression
 */
function renderIncomeGoal(incomeGoal) {
    const amountInput = document.getElementById('income-goal-amount');
    const progressContainer = document.getElementById('income-goal-progress');
    const progressBar = document.getElementById('income-goal-progress-bar');
    const statusElement = document.getElementById('income-goal-status');
    const currentElement = document.getElementById('income-goal-current');
    const targetElement = document.getElementById('income-goal-target');
    
    if (!incomeGoal) {
        if (progressContainer) progressContainer.style.display = 'none';
        return;
    }
    
    // Calculer le revenu actuel du mois
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const currentMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const progress = Math.min((currentMonthIncome / incomeGoal) * 100, 100);
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (currentElement) currentElement.textContent = formatCurrency(currentMonthIncome);
    if (targetElement) targetElement.textContent = formatCurrency(incomeGoal);
    
    // Déterminer le statut
    if (statusElement && progressBar) {
        if (progress >= 100) {
            statusElement.textContent = '✓ Objectif atteint';
            statusElement.className = 'goal-progress-status success';
            progressBar.className = 'progress-fill';
        } else if (progress >= 75) {
            statusElement.textContent = 'Presque atteint';
            statusElement.className = 'goal-progress-status warning';
            progressBar.className = 'progress-fill warning';
        } else {
            statusElement.textContent = 'En cours';
            statusElement.className = 'goal-progress-status';
            progressBar.className = 'progress-fill';
        }
    }
}

/**
 * Affiche les budgets par catégorie avec les barres de progression
 */
function renderCategoryBudgets(budgets) {
    const container = document.getElementById('budgets-container');
    if (!container) return;
    
    const data = loadData();
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p>Aucun budget défini</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez votre premier budget ci-dessus</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = budgets.map(budget => {
        const category = data.categories.find(c => c.id === budget.categoryId);
        if (!category) return ''; // Catégorie supprimée
        
        // Calculer les dépenses de cette catégorie ce mois-ci
        const categoryExpenses = transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear &&
                       t.categoryId === budget.categoryId &&
                       t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const progress = Math.min((categoryExpenses / budget.amount) * 100, 100);
        const remaining = budget.amount - categoryExpenses;
        
        let progressClass = '';
        let statusText = '';
        if (progress >= 100) {
            progressClass = 'danger';
            statusText = 'Budget dépassé';
        } else if (progress >= 80) {
            progressClass = 'warning';
            statusText = 'Attention';
        } else {
            statusText = 'Dans les limites';
        }
        
        return `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-category-info">
                        <div class="budget-category-color" style="background-color: ${category.color}"></div>
                        <div class="budget-category-name">${escapeHtml(category.name)}</div>
                    </div>
                    <div class="budget-amount">${formatCurrency(budget.amount)}</div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${progress}%">
                            ${progress >= 50 ? `${progress.toFixed(0)}%` : ''}
                        </div>
                    </div>
                </div>
                <div class="budget-details">
                    <span class="budget-spent">Dépensé: ${formatCurrency(categoryExpenses)}</span>
                    <span class="budget-remaining ${remaining >= 0 ? 'positive' : 'negative'}">
                        Restant: ${formatCurrency(remaining)}
                    </span>
                </div>
                <div class="budget-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteCategoryBudget('${budget.id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }).filter(html => html !== '').join('');
}

