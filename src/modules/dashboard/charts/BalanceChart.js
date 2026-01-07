import { getAllTransactions } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

// Variable pour stocker l'instance du graphique
let balanceChart = null;

/**
 * Crée le graphique linéaire pour l'évolution du solde
 */
export function renderBalanceChart() {
    const ctx = document.getElementById('balance-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filtrer les transactions des 30 derniers jours
    const recentTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= thirtyDaysAgo && transactionDate <= today;
    });
    
    // Trier par date
    recentTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Créer un tableau de dates pour les 30 derniers jours
    const dates = [];
    const balances = [];
    let runningBalance = 0;
    
    // Calculer le solde initial (avant les 30 derniers jours)
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < thirtyDaysAgo) {
            runningBalance += transaction.amount;
        }
    });
    
    // Générer les dates des 30 derniers jours
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        
        // Ajouter les transactions de ce jour
        const dateStr = date.toISOString().split('T')[0];
        const dayTransactions = recentTransactions.filter(t => t.date === dateStr);
        dayTransactions.forEach(t => {
            runningBalance += t.amount;
        });
        
        balances.push(runningBalance);
    }
    
    // Détruire le graphique existant s'il existe
    if (balanceChart) {
        balanceChart.destroy();
    }
    
    // Créer le nouveau graphique
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Solde (€)',
                data: balances,
                borderColor: '#99BDB4',
                backgroundColor: 'rgba(153, 189, 180, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#99BDB4',
                pointBorderColor: '#F2F1E6',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                            return `Solde: ${formatCurrency(context.parsed.y)}`;
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
                        }
                    },
                    grid: {
                        color: 'rgba(153, 189, 180, 0.15)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#6B6B6B'
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

