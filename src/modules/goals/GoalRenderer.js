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
    const goals = data.goals || { incomeGoals: { monthly: {} }, categoryBudgets: [] };
    
    // Afficher l'objectif de revenu
    renderIncomeGoal(goals.incomeGoals);
    
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
function renderIncomeGoal(incomeGoals) {
    if (!incomeGoals) {
        incomeGoals = { monthly: {} };
    }
    
    const progressContainer = document.getElementById('income-goal-progress');
    const progressBar = document.getElementById('income-goal-progress-bar');
    const statusElement = document.getElementById('income-goal-status');
    const currentElement = document.getElementById('income-goal-current');
    const targetElement = document.getElementById('income-goal-target');
    
    // Calculer le revenu actuel du mois
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    
    const currentMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Obtenir l'objectif du mois en cours
    const currentGoal = incomeGoals.monthly?.[currentMonthKey] || null;
    
    // Afficher le calendrier des objectifs
    renderIncomeGoalCalendar(incomeGoals);
    
    if (!currentGoal) {
        if (progressContainer) progressContainer.style.display = 'none';
        return;
    }
    
    const progress = Math.min((currentMonthIncome / currentGoal) * 100, 100);
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (currentElement) currentElement.textContent = formatCurrency(currentMonthIncome);
    if (targetElement) targetElement.textContent = formatCurrency(currentGoal);
    
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
 * Calcule le revenu réel d'un mois donné
 * @param {number} month - Mois (0-11)
 * @param {number} year - Année
 * @returns {number} - Total des revenus du mois
 */
function getMonthIncome(month, year) {
    const transactions = getAllTransactions();
    return transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === month && 
                   date.getFullYear() === year &&
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Affiche le calendrier des objectifs de revenu
 */
function renderIncomeGoalCalendar(incomeGoals) {
    const container = document.getElementById('income-goal-calendar-list');
    
    if (!container) return;
    
    const monthlyGoals = incomeGoals.monthly || {};
    
    // Générer une plage de 12 mois (6 avant, mois actuel, 6 après)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const months = [];
    
    // Générer les 12 mois
    for (let i = -6; i <= 6; i++) {
        const monthDate = new Date(currentYear, currentMonth + i, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const isCurrentMonth = month === currentMonth && year === currentYear;
        const isPast = monthDate < today;
        const isFuture = monthDate > today;
        
        // Récupérer l'objectif pour ce mois (0 si non défini)
        const goalAmount = monthlyGoals[monthKey] || 0;
        
        // Calculer les revenus réels du mois
        const actualIncome = getMonthIncome(month, year);
        
        // Déterminer si l'objectif est atteint
        const isAchieved = goalAmount > 0 && actualIncome >= goalAmount;
        
        months.push({
            date: new Date(monthDate),
            monthKey,
            goalAmount,
            actualIncome,
            isAchieved,
            isCurrentMonth,
            isPast,
            isFuture
        });
    }
    
    // Grouper les mois par année
    const monthsByYear = {};
    months.forEach(month => {
        const year = month.date.getFullYear();
        if (!monthsByYear[year]) {
            monthsByYear[year] = [];
        }
        monthsByYear[year].push(month);
    });
    
    // Générer le HTML du calendrier
    let htmlContent = '<div class="income-goal-calendar-grid">';
    
    // Message si aucun objectif défini
    const hasAnyGoal = Object.keys(monthlyGoals).some(key => monthlyGoals[key] > 0);
    if (!hasAnyGoal) {
        htmlContent += `
            <div class="empty-state" style="padding: 16px; text-align: center; color: var(--text-secondary); margin-bottom: 16px;">
                <p style="margin: 0;">Cliquez sur un mois pour définir un objectif</p>
            </div>
        `;
    }
    
    Object.keys(monthsByYear).sort().forEach(year => {
        htmlContent += `<div class="income-goal-calendar-year">`;
        htmlContent += `<div class="income-goal-calendar-year-header">${year}</div>`;
        htmlContent += `<div class="income-goal-calendar-months">`;
        
        monthsByYear[year].forEach(month => {
            const monthName = month.date.toLocaleDateString('fr-FR', { month: 'long' });
            const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            
            let monthClass = 'income-goal-calendar-month';
            if (month.isCurrentMonth) {
                monthClass += ' current-month';
            } else if (month.isPast) {
                monthClass += ' past-month';
            } else if (month.isFuture) {
                monthClass += ' future-month';
            }
            
            // Ajouter classe selon si l'objectif est atteint
            if (month.isAchieved) {
                monthClass += ' achieved';
            } else if (month.goalAmount > 0) {
                monthClass += ' not-achieved';
            }
            
            const displayAmount = month.goalAmount > 0 ? formatCurrency(month.goalAmount) : '—';
            
            htmlContent += `
                <div class="${monthClass}" data-month-key="${month.monthKey}" data-goal-amount="${month.goalAmount}">
                    <div class="income-goal-calendar-month-name">${capitalizedMonthName}</div>
                    <div class="income-goal-calendar-month-amount">${displayAmount}</div>
                    ${month.isCurrentMonth ? '<div class="income-goal-calendar-month-badge">Mois actuel</div>' : ''}
                </div>
            `;
        });
        
        htmlContent += `</div></div>`;
    });
    
    htmlContent += '</div>';
    
    container.innerHTML = htmlContent;
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
        const isExceeded = categoryExpenses > budget.amount;
        
        let progressClass = '';
        let statusText = '';
        if (isExceeded) {
            progressClass = 'danger';
            statusText = 'Budget dépassé';
        } else if (progress >= 80) {
            progressClass = 'warning';
            statusText = 'Attention';
        } else {
            statusText = 'Dans les limites';
        }
        
        return `
            <div class="budget-item ${isExceeded ? 'budget-exceeded' : ''}">
                <div class="budget-header">
                    <div class="budget-category-info">
                        <div class="budget-category-color" style="background-color: ${category.color}"></div>
                        <div class="budget-category-name">${escapeHtml(category.name)}</div>
                    </div>
                    <div class="budget-amount">${formatCurrency(budget.amount)}</div>
                </div>
                ${isExceeded ? '<div class="budget-alert-wrapper"><span class="budget-alert-badge">⚠️ Budget dépassé</span></div>' : ''}
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
    
    // Afficher le formulaire d'allocation
    categoriesList.innerHTML = renderAllocationForm(savingsCategories, totalSavings, allocations);
    
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
    
    // Attacher les event listeners
    attachAllocationEventListeners(savingsCategories, totalSavings);
}

/**
 * Rend le formulaire d'allocation et l'historique
 */
function renderAllocationForm(savingsCategories, totalSavings, allocations) {
    if (savingsCategories.length === 0) {
        return `
            <div class="empty-state">
                <p>Aucune catégorie d'économie créée</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez vos catégories avec le bouton "+ Nouvelle"</p>
            </div>
        `;
    }
    
    // Calculer le total alloué
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const remaining = totalSavings - totalAllocated;
    
    // Formulaire d'allocation
    const formHtml = `
        <div class="allocation-form-container">
            <form id="allocation-form" class="allocation-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="allocation-category">Catégorie</label>
                        <select id="allocation-category" required>
                            <option value="">Sélectionnez une catégorie</option>
                            ${savingsCategories.map(cat => `
                                <option value="${cat.id}" data-color="${cat.color}">
                                    ${escapeHtml(cat.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="allocation-amount">Montant (€)</label>
                        <input 
                            type="number" 
                            id="allocation-amount" 
                            step="0.01" 
                            min="0.01"
                            max="${remaining > 0 ? remaining : 0}"
                            placeholder="0.00"
                            required
                        >
                    </div>
                </div>
                <div class="form-group">
                    <label for="allocation-description">Description (optionnelle)</label>
                    <input 
                        type="text" 
                        id="allocation-description" 
                        placeholder="Ex: Placement mensuel, Épargne voyage..."
                    >
                </div>
                <button type="submit" class="btn btn-primary" ${remaining <= 0 ? 'disabled' : ''}>
                    Valider l'allocation
                </button>
            </form>
        </div>
    `;
    
    // Historique des allocations (trié par date décroissante)
    const sortedAllocations = [...allocations].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });
    
    const historyHtml = sortedAllocations.length > 0 ? `
        <div class="allocation-history">
            <h4>Historique</h4>
            <div class="allocation-items">
                ${sortedAllocations.map(alloc => {
                    const category = savingsCategories.find(c => c.id === alloc.categoryId);
                    if (!category) return '';
                    
                    const date = alloc.date ? new Date(alloc.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : '';
                    
                    return `
                        <div class="allocation-history-item">
                            <div class="allocation-item-header">
                                <div class="allocation-item-info">
                                    <div class="category-color-dot" style="background-color: ${category.color}"></div>
                                    <div class="allocation-item-details">
                                        <div class="allocation-main-info">
                                            <span class="allocation-category-name">${escapeHtml(category.name)}</span>
                                            ${alloc.description ? `<span class="allocation-description">${escapeHtml(alloc.description)}</span>` : ''}
                                        </div>
                                        ${date ? `<span class="allocation-date">${date}</span>` : ''}
                                    </div>
                                </div>
                                <div class="allocation-item-right">
                                    <span class="allocation-amount">${formatCurrency(alloc.amount)}</span>
                                    <button 
                                        class="btn-delete-allocation" 
                                        data-allocation-id="${alloc.id}"
                                        title="Supprimer"
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : `
        <div class="allocation-history">
            <h4>Historique</h4>
            <div class="empty-state">
                <p>Aucune allocation pour ce mois</p>
            </div>
        </div>
    `;
    
    return formHtml + historyHtml;
}

/**
 * Attache les event listeners au formulaire
 */
function attachAllocationEventListeners(savingsCategories, totalSavings) {
    const form = document.getElementById('allocation-form');
    const categorySelect = document.getElementById('allocation-category');
    
    if (form) {
        form.addEventListener('submit', handleAllocationSubmit);
    }
    
    // Mettre à jour le max de l'input montant en temps réel
    if (categorySelect) {
        const amountInput = document.getElementById('allocation-amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                const data = loadData();
                const year = currentAllocationMonth.getFullYear();
                const month = currentAllocationMonth.getMonth();
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                
                if (!data.savingsAllocations) {
                    data.savingsAllocations = {};
                }
                
                const allocations = data.savingsAllocations[monthKey] || [];
                const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
                const remaining = totalSavings - totalAllocated;
                
                amountInput.max = remaining > 0 ? remaining : 0;
            });
        }
    }
    
    // Event listeners pour les boutons de suppression
    const deleteButtons = document.querySelectorAll('.btn-delete-allocation');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const allocationId = e.currentTarget.dataset.allocationId;
            deleteAllocation(allocationId);
        });
    });
}

/**
 * Gère la soumission du formulaire d'allocation
 */
function handleAllocationSubmit(event) {
    event.preventDefault();
    
    const categorySelect = document.getElementById('allocation-category');
    const amountInput = document.getElementById('allocation-amount');
    const descriptionInput = document.getElementById('allocation-description');
    
    const categoryId = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    
    if (!categoryId || !amount) {
        alert('Veuillez sélectionner une catégorie et entrer un montant');
        return;
    }
    
    const data = loadData();
    const year = currentAllocationMonth.getFullYear();
    const month = currentAllocationMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const totalSavings = calculateMonthSavings(year, month);
    
    if (!data.savingsAllocations) {
        data.savingsAllocations = {};
    }
    
    if (!data.savingsAllocations[monthKey]) {
        data.savingsAllocations[monthKey] = [];
    }
    
    // Calculer le total déjà alloué
    const totalAllocated = data.savingsAllocations[monthKey].reduce((sum, a) => sum + (a.amount || 0), 0);
    
    // Vérifier qu'on ne dépasse pas les économies
    if (totalAllocated + amount > totalSavings) {
        alert(`Impossible d'allouer ce montant. Reste disponible : ${formatCurrency(totalSavings - totalAllocated)}`);
        return;
    }
    
    // Créer la nouvelle allocation
    const newAllocation = {
        id: Date.now().toString(),
        categoryId,
        amount,
        description,
        date: new Date().toISOString()
    };
    
    data.savingsAllocations[monthKey].push(newAllocation);
    saveData(data);
    
    // Réinitialiser le formulaire
    event.target.reset();
    
    // Recharger l'affichage et notifier les modules
    renderSavingsAllocation();
    if (window.renderSavingsTreemap) window.renderSavingsTreemap();
}

/**
 * Supprime une allocation
 */
function deleteAllocation(allocationId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette allocation ?')) {
        return;
    }
    
    const data = loadData();
    const year = currentAllocationMonth.getFullYear();
    const month = currentAllocationMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    if (!data.savingsAllocations || !data.savingsAllocations[monthKey]) {
        return;
    }
    
    data.savingsAllocations[monthKey] = data.savingsAllocations[monthKey].filter(
        a => a.id !== allocationId
    );
    
    saveData(data);
    renderSavingsAllocation();
    if (window.renderSavingsTreemap) window.renderSavingsTreemap();
}

