import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

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
    
    Object.keys(expensesByCategory).forEach(categoryId => {
        const category = data.categories.find(cat => cat.id === categoryId);
        if (category) {
            labels.push(category.name);
            values.push(expensesByCategory[categoryId]);
            colors.push(category.color);
        }
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
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="expenses-chart"></canvas>';
        const newCtx = document.getElementById('expenses-chart');
        expensesChart = new Chart(newCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#F2F1E6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        onHover: function(e, legendItem) {
                            e.native.target.style.cursor = 'pointer';
                            if (legendItem) {
                                const chart = this.chart;
                                const index = legendItem.index; // Pour doughnut, utiliser index au lieu de datasetIndex
                                const dataset = chart.data.datasets[0];
                                
                                // Stocker les couleurs originales si pas déjà fait
                                if (!chart._originalColors) {
                                    chart._originalColors = [...dataset.backgroundColor];
                                }
                                
                                // Modifier l'opacité de tous les segments
                                dataset.backgroundColor = dataset.backgroundColor.map((color, i) => {
                                    if (i === index) {
                                        return color; // Garder la couleur complète pour le segment survolé
                                    } else {
                                        // Réduire l'opacité des autres segments
                                        if (color.startsWith('#')) {
                                            const r = parseInt(color.slice(1, 3), 16);
                                            const g = parseInt(color.slice(3, 5), 16);
                                            const b = parseInt(color.slice(5, 7), 16);
                                            return `rgba(${r}, ${g}, ${b}, 0.2)`;
                                        }
                                        return color.replace('1)', '0.2)').replace('1.0)', '0.2)');
                                    }
                                });
                                chart.update('none');
                            }
                        },
                        onLeave: function(e, legendItem) {
                            e.native.target.style.cursor = 'default';
                            if (legendItem && this.chart._originalColors) {
                                const chart = this.chart;
                                const dataset = chart.data.datasets[0];
                                
                                // Restaurer les couleurs originales
                                dataset.backgroundColor = chart._originalColors;
                                chart.update('none');
                            }
                        },
                        labels: {
                            padding: 18,
                            usePointStyle: true,
                            font: {
                                size: 13,
                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            },
                            color: '#2C2C2C'
                        }
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
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        expensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#F2F1E6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        onHover: function(e, legendItem) {
                            e.native.target.style.cursor = 'pointer';
                            if (legendItem) {
                                const chart = this.chart;
                                const index = legendItem.index; // Pour doughnut, utiliser index au lieu de datasetIndex
                                const dataset = chart.data.datasets[0];
                                
                                // Stocker les couleurs originales si pas déjà fait
                                if (!chart._originalColors) {
                                    chart._originalColors = [...dataset.backgroundColor];
                                }
                                
                                // Modifier l'opacité de tous les segments
                                dataset.backgroundColor = dataset.backgroundColor.map((color, i) => {
                                    if (i === index) {
                                        return color; // Garder la couleur complète pour le segment survolé
                                    } else {
                                        // Réduire l'opacité des autres segments
                                        if (color.startsWith('#')) {
                                            const r = parseInt(color.slice(1, 3), 16);
                                            const g = parseInt(color.slice(3, 5), 16);
                                            const b = parseInt(color.slice(5, 7), 16);
                                            return `rgba(${r}, ${g}, ${b}, 0.2)`;
                                        }
                                        return color.replace('1)', '0.2)').replace('1.0)', '0.2)');
                                    }
                                });
                                chart.update('none');
                            }
                        },
                        onLeave: function(e, legendItem) {
                            e.native.target.style.cursor = 'default';
                            if (legendItem && this.chart._originalColors) {
                                const chart = this.chart;
                                const dataset = chart.data.datasets[0];
                                
                                // Restaurer les couleurs originales
                                dataset.backgroundColor = chart._originalColors;
                                chart.update('none');
                            }
                        },
                        labels: {
                            padding: 18,
                            usePointStyle: true,
                            font: {
                                size: 13,
                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            },
                            color: '#2C2C2C'
                        }
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
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

