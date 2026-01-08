import { getAllTransactions } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

// Variable pour stocker l'instance du graphique
let savingsChart = null;

/**
 * Crée le graphique des économies par mois (revenus - dépenses)
 */
export function renderSavingsChart(selectedMonth = null, selectedYear = null) {
    const ctx = document.getElementById('savings-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const today = new Date();
    
    // Utiliser le mois sélectionné comme référence, sinon le mois en cours
    const referenceMonth = selectedMonth !== null ? selectedMonth : today.getMonth();
    const referenceYear = selectedYear !== null ? selectedYear : today.getFullYear();
    
    // Générer les 12 mois précédant le mois de référence (inclus)
    const months = [];
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(referenceYear, referenceMonth - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthKeys.push(monthKey);
        months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
    }
    
    // Calculer les revenus et dépenses par mois
    const monthlyData = {};
    monthKeys.forEach(monthKey => {
        monthlyData[monthKey] = {
            income: 0,
            expenses: 0
        };
    });
    
    // Remplir avec les données des transactions
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
            if (transaction.amount > 0) {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expenses += Math.abs(transaction.amount);
            }
        }
    });
    
    // Calculer les économies (revenus - dépenses) par mois
    const savings = monthKeys.map(monthKey => {
        const data = monthlyData[monthKey];
        return data.income - data.expenses;
    });
    
    // Vérifier s'il y a des données
    const hasData = savings.some(value => value !== 0);
    
    if (!hasData) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucune donnée disponible</p>';
        }
        if (savingsChart) {
            savingsChart.destroy();
            savingsChart = null;
        }
        return;
    }
    
    // Restaurer le canvas si nécessaire
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="savings-chart"></canvas>';
        const newCtx = document.getElementById('savings-chart');
        createSavingsChart(newCtx, months, savings);
    } else {
        createSavingsChart(ctx, months, savings);
    }
}

/**
 * Crée l'instance Chart.js pour les économies par mois
 */
function createSavingsChart(ctx, labels, savings) {
    // Détruire le graphique existant
    if (savingsChart) {
        savingsChart.destroy();
    }
    
    // Déterminer les couleurs selon si les économies sont positives ou négatives
    const backgroundColors = savings.map(value => {
        return value >= 0 ? 'rgba(153, 189, 180, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    });
    
    const borderColors = savings.map(value => {
        return value >= 0 ? '#99BDB4' : '#EF4444';
    });
    
    savingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Économies (€)',
                data: savings,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#F8F7F2',
                    titleColor: '#2C2C2C',
                    bodyColor: '#2C2C2C',
                    borderColor: '#99BDB4',
                    borderWidth: 2,
                    padding: 12,
                    cornerRadius: 12,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const sign = value >= 0 ? '+' : '';
                            return `Économies: ${sign}${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        color: '#6B6B6B'
                    },
                    grid: {
                        color: 'rgba(153, 189, 180, 0.15)',
                        lineWidth: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6B6B6B'
                    }
                }
            }
        }
    });
}

