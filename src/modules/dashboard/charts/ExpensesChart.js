import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';
import { lightenColor, createDoughnutChartConfig } from './chartUtils.js';

// Variable pour stocker l'instance du graphique
let expensesChart = null;

/**
 * Crée le graphique en camembert pour les dépenses par catégorie
 */
export function renderExpensesChart() {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrer les dépenses du mois en cours
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
        colors.push(lightenColor(color)); // Intérieur plus clair
        borderColors.push(color); // Contour de la couleur normale
    });
    
    // Détruire le graphique existant s'il existe
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    // Créer le nouveau graphique
    if (labels.length === 0) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucune dépense ce mois-ci</p>';
        }
        expensesChart = null;
        return;
    }
    
    // Restaurer le canvas si nécessaire
    let chartCtx = ctx;
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="expenses-chart"></canvas>';
        chartCtx = document.getElementById('expenses-chart');
    }
    
    // Créer le graphique avec la configuration partagée
    const config = createDoughnutChartConfig(labels, values, colors, borderColors, formatCurrency);
    expensesChart = new Chart(chartCtx, config);
}

