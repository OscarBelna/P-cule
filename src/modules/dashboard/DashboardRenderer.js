import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { formatCurrency } from '../shared/index.js';
import { renderExpensesChart, renderBalanceChart } from './DashboardCharts.js';

/**
 * Affiche le tableau de bord avec tous les KPI et graphiques
 */
export function renderDashboard() {
    updateSummaryCards();
    renderExpensesChart();
    renderBalanceChart();
    calculatePrediction();
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

