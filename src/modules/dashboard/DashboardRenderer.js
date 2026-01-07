import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { formatCurrency } from '../shared/index.js';
import { renderExpensesChart } from './charts/ExpensesChart.js';
import { renderIncomeChart } from './charts/IncomeChart.js';
import { renderBalanceChart } from './charts/BalanceChart.js';
import { renderExpensesEvolutionChart } from './charts/ExpensesEvolutionChart.js';
import { renderIncomeEvolutionChart } from './charts/IncomeEvolutionChart.js';

/**
 * Affiche le tableau de bord avec tous les KPI et graphiques
 */
export function renderDashboard() {
    updateSummaryCards();
    renderExpensesChart();
    renderIncomeChart();
    renderBalanceChart();
    calculatePrediction();
    renderExpensesEvolutionChart();
    renderIncomeEvolutionChart();
}

/**
 * Met à jour les cartes de résumé
 */
export function updateSummaryCards() {
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrer les transactions du mois en cours
    const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Calculer les totaux
    let totalIncome = 0;
    let totalExpenses = 0;
    
    currentMonthTransactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += Math.abs(transaction.amount);
        }
    });
    
    const currentBalance = totalIncome - totalExpenses;
    
    // Mettre à jour l'affichage
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const currentBalanceEl = document.getElementById('current-balance');
    
    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
    if (currentBalanceEl) currentBalanceEl.textContent = formatCurrency(currentBalance);
    
    // Ajuster les tailles des cartes après la mise à jour
    setTimeout(() => {
        adjustSummaryCardsSizes();
    }, 0);
}

/**
 * Calcule et affiche la prédiction du solde
 */
export function calculatePrediction() {
    const allTransactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - today.getDate();
    
    // Calculer le solde actuel du mois (avec toutes les transactions, y compris récurrentes générées)
    const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    let currentBalance = 0;
    currentMonthTransactions.forEach(transaction => {
        currentBalance += transaction.amount;
    });
    
    // Calculer les revenus récurrents restants (utiliser les transactions originales)
    let remainingIncome = 0;
    const recurringIncomes = data.transactions.filter(t => 
        t.recurrence === 'monthly' && t.amount > 0
    );
    
    recurringIncomes.forEach(income => {
        const incomeDate = new Date(income.date);
        const incomeDay = incomeDate.getDate();
        
        // Si la date de récurrence est après aujourd'hui ce mois-ci
        if (incomeDay > today.getDate() && 
            incomeDate.getMonth() === currentMonth && 
            incomeDate.getFullYear() === currentYear) {
            remainingIncome += income.amount;
        }
    });
    
    // Calculer les dépenses récurrentes restantes (utiliser les transactions originales)
    let remainingExpenses = 0;
    const recurringExpenses = data.transactions.filter(t => 
        t.recurrence === 'monthly' && t.amount < 0
    );
    
    recurringExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const expenseDay = expenseDate.getDate();
        
        // Si la date de récurrence est après aujourd'hui ce mois-ci
        if (expenseDay > today.getDate() && 
            expenseDate.getMonth() === currentMonth && 
            expenseDate.getFullYear() === currentYear) {
            remainingExpenses += Math.abs(expense.amount);
        }
    });
    
    // Calculer la moyenne des dépenses quotidiennes passées (hors récurrentes)
    const pastExpenses = currentMonthTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.amount < 0 && 
               transactionDate <= today &&
               !t.isRecurring; // Exclure les transactions récurrentes générées pour le calcul de la moyenne
    });
    
    const totalPastExpenses = pastExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const daysPassed = today.getDate();
    const avgDailyExpenses = daysPassed > 0 ? totalPastExpenses / daysPassed : 0;
    const estimatedFutureExpenses = avgDailyExpenses * daysRemaining;
    
    // Calculer le solde estimé
    const predictedBalance = currentBalance + remainingIncome - remainingExpenses - estimatedFutureExpenses;
    
    // Mettre à jour l'affichage
    const currentBalanceEl = document.getElementById('prediction-current-balance');
    const remainingIncomeEl = document.getElementById('prediction-remaining-income');
    const remainingExpensesEl = document.getElementById('prediction-remaining-expenses');
    const avgDailyEl = document.getElementById('prediction-avg-daily');
    const predictedBalanceEl = document.getElementById('predicted-balance');
    
    if (currentBalanceEl) currentBalanceEl.textContent = formatCurrency(currentBalance);
    if (remainingIncomeEl) remainingIncomeEl.textContent = formatCurrency(remainingIncome);
    if (remainingExpensesEl) remainingExpensesEl.textContent = formatCurrency(remainingExpenses);
    if (avgDailyEl) avgDailyEl.textContent = formatCurrency(estimatedFutureExpenses);
    if (predictedBalanceEl) {
        predictedBalanceEl.textContent = formatCurrency(predictedBalance);
        // Changer la couleur selon si positif ou négatif
        predictedBalanceEl.style.color = predictedBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    }
}

/**
 * Ajuste automatiquement la taille des icônes et du texte dans les cartes de résumé
 * pour éviter que le texte dépasse
 */
export function adjustSummaryCardsSizes() {
    const summaryCards = document.querySelectorAll('.summary-card');
    
    summaryCards.forEach(card => {
        const iconEl = card.querySelector('.summary-card-icon');
        const contentEl = card.querySelector('.summary-card-content');
        const valueEl = card.querySelector('.summary-card-value');
        
        if (!iconEl || !contentEl || !valueEl) return;
        
        // Réinitialiser les styles
        iconEl.style.fontSize = '';
        valueEl.style.fontSize = '';
        
        // Tailles initiales (correspondent aux valeurs CSS)
        const initialIconSize = 36; // px
        const initialValueSize = 22; // px
        const minIconSize = 20; // Taille minimale de l'icône
        const minValueSize = 16; // Taille minimale du texte
        const margin = 12; // Marge de sécurité en px
        
        // Utiliser requestAnimationFrame pour s'assurer que le layout est calculé
        requestAnimationFrame(() => {
            const cardRect = card.getBoundingClientRect();
            const cardWidth = cardRect.width;
            const cardRight = cardRect.right;
            
            // Vérifier si le contenu dépasse
            const valueRect = valueEl.getBoundingClientRect();
            const contentRect = contentEl.getBoundingClientRect();
            
            const valueOverflow = valueRect.right > (cardRight - margin);
            const contentOverflow = contentRect.right > (cardRight - margin);
            
            if (valueOverflow || contentOverflow) {
                let iconSize = initialIconSize;
                let valueSize = initialValueSize;
                let fits = false;
                
                // Étape 1: Réduire d'abord la taille de l'icône
                while (!fits && iconSize > minIconSize) {
                    iconSize -= 2; // Réduire par pas de 2px
                    iconEl.style.fontSize = `${iconSize}px`;
                    
                    // Forcer le recalcul du layout (lecture synchrone)
                    const _ = card.offsetHeight;
                    
                    // Vérifier si ça rentre maintenant
                    const newValueRect = valueEl.getBoundingClientRect();
                    const newContentRect = contentEl.getBoundingClientRect();
                    
                    if (newValueRect.right <= (cardRight - margin) && 
                        newContentRect.right <= (cardRight - margin)) {
                        fits = true;
                        break;
                    }
                }
                
                // Étape 2: Si l'icône est à sa taille minimale et que ça ne rentre toujours pas, réduire le texte
                if (!fits) {
                    iconEl.style.fontSize = `${minIconSize}px`;
                    const _ = card.offsetHeight; // Forcer le recalcul
                    
                    // Réduire la taille du texte
                    while (!fits && valueSize > minValueSize) {
                        valueSize -= 1; // Réduire par pas de 1px
                        valueEl.style.fontSize = `${valueSize}px`;
                        
                        // Forcer le recalcul du layout
                        const __ = card.offsetHeight;
                        
                        // Vérifier si ça rentre maintenant
                        const newValueRect = valueEl.getBoundingClientRect();
                        const newContentRect = contentEl.getBoundingClientRect();
                        
                        if (newValueRect.right <= (cardRight - margin) && 
                            newContentRect.right <= (cardRight - margin)) {
                            fits = true;
                            break;
                        }
                    }
                    
                    // Si toujours pas assez, forcer la taille minimale
                    if (!fits) {
                        valueEl.style.fontSize = `${minValueSize}px`;
                    }
                }
            }
        });
    });
}

