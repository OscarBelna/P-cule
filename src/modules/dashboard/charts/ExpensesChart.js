import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';
import { lightenColor, createDoughnutChartConfig } from './chartUtils.js';

// Variable pour stocker l'instance du graphique
let expensesChart = null;

/**
 * Crée le graphique en camembert pour les dépenses par catégorie
 */
export function renderExpensesChart(selectedMonth = null, selectedYear = null) {
    let container = document.querySelector('#expenses-chart')?.parentElement;
    if (!container) {
        const chartCard = Array.from(document.querySelectorAll('.chart-card')).find(card => 
            card.querySelector('h2')?.textContent.includes('Dépenses par catégorie')
        );
        container = chartCard?.querySelector('.chart-container');
    }
    if (!container) return;
    
    let ctx = document.getElementById('expenses-chart');
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = selectedMonth !== null ? selectedMonth : today.getMonth();
    const currentYear = selectedYear !== null ? selectedYear : today.getFullYear();
    
    // Filtrer les dépenses du mois sélectionné
    const currentMonthExpenses = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               transaction.amount < 0;
    });
    
    // Grouper par catégorie
    const expensesByCategory = {};
    currentMonthExpenses.forEach(transaction => {
        const categoryId = transaction.categoryId;
        if (!expensesByCategory[categoryId]) {
            expensesByCategory[categoryId] = 0;
        }
        expensesByCategory[categoryId] += Math.abs(transaction.amount);
    });
    
    // Préparer les données pour Chart.js
    const labels = [];
    const values = [];
    const colors = [];
    const borderColors = [];
    
    Object.keys(expensesByCategory).forEach(categoryId => {
        const category = data.categories.find(cat => cat.id === categoryId);
        const color = category ? category.color : '#99BDB4';
        labels.push(category ? category.name : 'Inconnu');
        values.push(expensesByCategory[categoryId]);
        colors.push(lightenColor(color));
        borderColors.push(color);
    });
    
    if (expensesChart) {
        expensesChart.destroy();
        expensesChart = null;
    }
    
    if (labels.length === 0) {
        if (!container.innerHTML.includes('<p class="placeholder">')) {
            container.innerHTML = '<p class="placeholder">Aucune dépense ce mois-ci</p>';
        }
        return;
    }
    
    if (!ctx || container.innerHTML.includes('<p')) {
        container.innerHTML = '<canvas id="expenses-chart"></canvas>';
        ctx = document.getElementById('expenses-chart');
    }
    
    if (!ctx) return;
    const config = createDoughnutChartConfig(labels, values, colors, borderColors, formatCurrency);
    expensesChart = new Chart(ctx, config);
}

