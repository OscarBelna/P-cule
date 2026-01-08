import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';
import { lightenColor, createDoughnutChartConfig } from './chartUtils.js';

// Variable pour stocker l'instance du graphique
let incomeChart = null;

/**
 * Crée le graphique en camembert pour les revenus par catégorie
 */
export function renderIncomeChart(selectedMonth = null, selectedYear = null) {
    let container = document.querySelector('#income-chart')?.parentElement;
    if (!container) {
        const chartCard = Array.from(document.querySelectorAll('.chart-card')).find(card => 
            card.querySelector('h2')?.textContent.includes('Revenus par catégorie')
        );
        container = chartCard?.querySelector('.chart-container');
    }
    if (!container) return;
    
    let ctx = document.getElementById('income-chart');
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = selectedMonth !== null ? selectedMonth : today.getMonth();
    const currentYear = selectedYear !== null ? selectedYear : today.getFullYear();
    
    // Filtrer les revenus du mois sélectionné
    const currentMonthIncomes = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               transaction.amount > 0;
    });
    
    // Grouper par catégorie
    const incomesByCategory = {};
    currentMonthIncomes.forEach(transaction => {
        const categoryId = transaction.categoryId;
        if (!incomesByCategory[categoryId]) {
            incomesByCategory[categoryId] = 0;
        }
        incomesByCategory[categoryId] += transaction.amount;
    });
    
    // Préparer les données pour Chart.js
    const labels = [];
    const values = [];
    const colors = [];
    const borderColors = [];
    
    Object.keys(incomesByCategory).forEach(categoryId => {
        const category = data.categories.find(cat => cat.id === categoryId);
        const color = category ? category.color : '#99BDB4';
        labels.push(category ? category.name : 'Inconnu');
        values.push(incomesByCategory[categoryId]);
        colors.push(lightenColor(color));
        borderColors.push(color);
    });
    
    if (incomeChart) {
        incomeChart.destroy();
        incomeChart = null;
    }
    
    if (labels.length === 0) {
        if (!container.innerHTML.includes('<p class="placeholder">')) {
            container.innerHTML = '<p class="placeholder">Aucun revenu ce mois-ci</p>';
        }
        return;
    }
    
    if (!ctx || container.innerHTML.includes('<p')) {
        container.innerHTML = '<canvas id="income-chart"></canvas>';
        ctx = document.getElementById('income-chart');
    }
    
    if (!ctx) return;
    const config = createDoughnutChartConfig(labels, values, colors, borderColors, formatCurrency);
    incomeChart = new Chart(ctx, config);
}
