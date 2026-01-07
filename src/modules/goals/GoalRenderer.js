import { loadData, saveData } from '../shared/index.js';
import { getAllTransactions } from '../shared/index.js';
import { formatCurrency, escapeHtml } from '../shared/index.js';

// Variable pour suivre le mois sélectionné dans l'allocation
let currentAllocationMonth = new Date();

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
    
    // Afficher l'interface de répartition des économies
    renderSavingsAllocation();
}

/**
 * Initialise les contrôles de navigation du mois pour l'allocation
 */
export function initSavingsAllocationControls() {
    const prevBtn = document.getElementById('allocation-prev-month');
    const nextBtn = document.getElementById('allocation-next-month');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentAllocationMonth.setMonth(currentAllocationMonth.getMonth() - 1);
            renderSavingsAllocation();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentAllocationMonth.setMonth(currentAllocationMonth.getMonth() + 1);
            renderSavingsAllocation();
        });
    }
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

/**
 * Calcule les économies pour un mois donné
 */
function calculateMonthSavings(year, month) {
    const transactions = getAllTransactions();
    
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
    
    let income = 0;
    let expenses = 0;
    
    monthTransactions.forEach(t => {
        if (t.amount > 0) {
            income += t.amount;
        } else {
            expenses += Math.abs(t.amount);
        }
    });
    
    return income - expenses;
}

/**
 * Affiche l'interface de répartition des économies
 */
export function renderSavingsAllocation() {
    const monthLabel = document.getElementById('allocation-month-label');
    const totalSavingsEl = document.getElementById('total-savings-amount');
    const remainingSavingsEl = document.getElementById('remaining-savings-amount');
    const categoriesList = document.getElementById('savings-categories-list');
    const feedbackEl = document.getElementById('allocation-feedback');
    
    if (!monthLabel || !totalSavingsEl || !remainingSavingsEl || !categoriesList || !feedbackEl) {
        return;
    }
    
    // Mettre à jour le label du mois
    monthLabel.textContent = currentAllocationMonth.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
    });
    
    // Calculer les économies du mois
    const year = currentAllocationMonth.getFullYear();
    const month = currentAllocationMonth.getMonth();
    const totalSavings = calculateMonthSavings(year, month);
    
    totalSavingsEl.textContent = formatCurrency(totalSavings);
    
    // Charger les données
    const data = loadData();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // S'assurer que savingsAllocations existe
    if (!data.savingsAllocations) {
        data.savingsAllocations = {};
    }
    
    const allocations = data.savingsAllocations[monthKey] || [];
    
    // Filtrer les catégories de type 'savings'
    const savingsCategories = data.categories.filter(c => c.type === 'savings');
    
    // Si économies négatives ou nulles
    if (totalSavings <= 0) {
        categoriesList.innerHTML = '';
        feedbackEl.innerHTML = `
            <div class="feedback-message info-message">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Ce mois-ci, l'objectif est de stabiliser le budget pour épargner le mois prochain.</span>
            </div>
        `;
        remainingSavingsEl.textContent = formatCurrency(0);
        remainingSavingsEl.parentElement.classList.remove('positive', 'negative');
        return;
    }
    
    // Si pas de catégories d'économie
    if (savingsCategories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <p>Aucune catégorie d'économie créée</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez vos catégories dans les Paramètres</p>
            </div>
        `;
        feedbackEl.innerHTML = '';
        remainingSavingsEl.textContent = formatCurrency(totalSavings);
        return;
    }
    
    // Générer les inputs pour chaque catégorie
    categoriesList.innerHTML = savingsCategories.map(category => {
        const allocation = allocations.find(a => a.categoryId === category.id);
        const amount = allocation ? allocation.amount : 0;
        
        return `
            <div class="savings-category-item">
                <div class="category-info">
                    <div class="category-color-dot" style="background-color: ${category.color}"></div>
                    <label for="allocation-${category.id}">${escapeHtml(category.name)}</label>
                </div>
                <div class="amount-input-wrapper">
                    <input 
                        type="number" 
                        id="allocation-${category.id}" 
                        class="allocation-input"
                        data-category-id="${category.id}"
                        value="${amount}"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    >
                    <span class="currency-symbol">€</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Calculer le reste à répartir
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const remaining = totalSavings - totalAllocated;
    
    remainingSavingsEl.textContent = formatCurrency(remaining);
    
    // Mettre à jour la classe selon le reste
    const highlightRow = remainingSavingsEl.parentElement;
    highlightRow.classList.remove('positive', 'negative', 'zero');
    if (remaining > 0) {
        highlightRow.classList.add('positive');
    } else if (remaining < 0) {
        highlightRow.classList.add('negative');
    } else {
        highlightRow.classList.add('zero');
    }
    
    // Message de feedback
    if (remaining === 0 && totalAllocated > 0) {
        feedbackEl.innerHTML = `
            <div class="feedback-message success-message">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Bravo ! Chaque euro est à sa place.</span>
            </div>
        `;
    } else {
        feedbackEl.innerHTML = '';
    }
    
    // Attacher les event listeners aux inputs
    const inputs = categoriesList.querySelectorAll('.allocation-input');
    inputs.forEach(input => {
        input.addEventListener('input', handleAllocationInput);
        input.addEventListener('change', saveAllocation);
    });
}

/**
 * Gère la saisie dans les inputs d'allocation (mise à jour temps réel)
 */
function handleAllocationInput(event) {
    const data = loadData();
    const year = currentAllocationMonth.getFullYear();
    const month = currentAllocationMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // S'assurer que savingsAllocations existe
    if (!data.savingsAllocations) {
        data.savingsAllocations = {};
    }
    
    const allocations = data.savingsAllocations[monthKey] || [];
    
    // Calculer le total alloué en temps réel
    const inputs = document.querySelectorAll('.allocation-input');
    let totalAllocated = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalAllocated += value;
    });
    
    const totalSavings = calculateMonthSavings(year, month);
    const remaining = totalSavings - totalAllocated;
    
    const remainingSavingsEl = document.getElementById('remaining-savings-amount');
    if (remainingSavingsEl) {
        remainingSavingsEl.textContent = formatCurrency(remaining);
        
        const highlightRow = remainingSavingsEl.parentElement;
        highlightRow.classList.remove('positive', 'negative', 'zero');
        if (remaining > 0) {
            highlightRow.classList.add('positive');
        } else if (remaining < 0) {
            highlightRow.classList.add('negative');
        } else {
            highlightRow.classList.add('zero');
        }
    }
}

/**
 * Sauvegarde l'allocation d'une catégorie
 */
function saveAllocation(event) {
    const input = event.target;
    const categoryId = input.dataset.categoryId;
    const amount = parseFloat(input.value) || 0;
    
    const data = loadData();
    const year = currentAllocationMonth.getFullYear();
    const month = currentAllocationMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    if (!data.savingsAllocations[monthKey]) {
        data.savingsAllocations[monthKey] = [];
    }
    
    const existingIndex = data.savingsAllocations[monthKey].findIndex(a => a.categoryId === categoryId);
    
    if (amount > 0) {
        if (existingIndex !== -1) {
            data.savingsAllocations[monthKey][existingIndex].amount = amount;
        } else {
            data.savingsAllocations[monthKey].push({ categoryId, amount });
        }
    } else {
        // Retirer l'allocation si le montant est 0
        if (existingIndex !== -1) {
            data.savingsAllocations[monthKey].splice(existingIndex, 1);
        }
    }
    
    saveData(data);
    
    // Mettre à jour le feedback
    const totalSavings = calculateMonthSavings(year, month);
    const totalAllocated = data.savingsAllocations[monthKey].reduce((sum, a) => sum + (a.amount || 0), 0);
    const remaining = totalSavings - totalAllocated;
    
    const feedbackEl = document.getElementById('allocation-feedback');
    if (feedbackEl && remaining === 0 && totalAllocated > 0) {
        feedbackEl.innerHTML = `
            <div class="feedback-message success-message">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Bravo ! Chaque euro est à sa place.</span>
            </div>
        `;
    } else {
        if (feedbackEl) feedbackEl.innerHTML = '';
    }
    
    // Notifier le dashboard pour mettre à jour le Treemap
    if (window.renderSavingsTreemap) {
        window.renderSavingsTreemap();
    }
}

