import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';
import { lightenColor, createDoughnutChartConfig } from './chartUtils.js';

// Variable pour stocker l'instance du graphique
let incomeChart = null;

/**
 * Crée le graphique en camembert pour les revenus par catégorie
 */
export function renderIncomeChart() {
    const ctx = document.getElementById('income-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrer les revenus du mois en cours
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
        colors.push(lightenColor(color)); // Intérieur plus clair
        borderColors.push(color); // Contour de la couleur normale
    });
    
    // Détruire le graphique existant s'il existe
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    // Créer le nouveau graphique
    if (labels.length === 0) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucun revenu ce mois-ci</p>';
        }
        incomeChart = null;
        return;
    }
    
    // Restaurer le canvas si nécessaire
    let chartCtx = ctx;
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="income-chart"></canvas>';
        chartCtx = document.getElementById('income-chart');
    }
    
    // Créer le graphique avec la configuration partagée
    const config = createDoughnutChartConfig(labels, values, colors, borderColors, formatCurrency);
    incomeChart = new Chart(chartCtx, config);
}
