import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

// Variable pour stocker l'instance du graphique
let expensesEvolutionChart = null;

/**
 * Crée le graphique d'évolution des dépenses par catégorie (12 derniers mois)
 */
export function renderExpensesEvolutionChart(selectedMonth = null, selectedYear = null) {
    const ctx = document.getElementById('expenses-evolution-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    
    // Utiliser le mois sélectionné comme référence, sinon le mois en cours
    const referenceMonth = selectedMonth !== null ? selectedMonth : today.getMonth();
    const referenceYear = selectedYear !== null ? selectedYear : today.getFullYear();
    
    // Obtenir toutes les catégories avec dépenses
    const expenseCategoryIds = new Set();
    transactions.forEach(transaction => {
        if (transaction.amount < 0 && transaction.categoryId) {
            expenseCategoryIds.add(transaction.categoryId);
        }
    });
    
    const categoryIds = Array.from(expenseCategoryIds);
    
    // Si aucune catégorie avec dépenses, afficher un message
    if (categoryIds.length === 0) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucune dépense disponible</p>';
        }
        if (expensesEvolutionChart) {
            expensesEvolutionChart.destroy();
            expensesEvolutionChart = null;
        }
        return;
    }
    
    // Générer les 12 mois précédant le mois de référence (inclus)
    const months = [];
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(referenceYear, referenceMonth - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthKeys.push(monthKey);
        months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
    }
    
    // Initialiser les données par catégorie
    const categoryData = {};
    categoryIds.forEach(catId => {
        categoryData[catId] = {};
        monthKeys.forEach(monthKey => {
            categoryData[catId][monthKey] = 0;
        });
    });
    
    // Remplir avec les données des transactions
    transactions.forEach(transaction => {
        if (transaction.amount < 0 && categoryIds.includes(transaction.categoryId)) {
            const transactionDate = new Date(transaction.date);
            const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
            if (categoryData[transaction.categoryId] && categoryData[transaction.categoryId][monthKey] !== undefined) {
                categoryData[transaction.categoryId][monthKey] += Math.abs(transaction.amount);
            }
        }
    });
    
    // Préparer les datasets pour Chart.js
    const datasets = categoryIds.map(catId => {
        const category = data.categories.find(c => c.id === catId);
        const color = category ? category.color : '#99BDB4';
        return {
            label: category ? category.name : 'Inconnu',
            data: monthKeys.map(monthKey => categoryData[catId][monthKey] || 0),
            backgroundColor: color + '80', // 50% opacity
            borderColor: color,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: color,
            pointBorderColor: '#F2F1E6',
            pointBorderWidth: 2
        };
    });
    
    // Vérifier s'il y a des données
    const hasData = datasets.some(dataset => dataset.data.some(value => value > 0));
    
    if (!hasData) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucune donnée disponible</p>';
        }
        if (expensesEvolutionChart) {
            expensesEvolutionChart.destroy();
            expensesEvolutionChart = null;
        }
        return;
    }
    
    // Restaurer le canvas si nécessaire
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="expenses-evolution-chart"></canvas>';
        const newCtx = document.getElementById('expenses-evolution-chart');
        createExpensesEvolutionChart(newCtx, months, datasets);
    } else {
        createExpensesEvolutionChart(ctx, months, datasets);
    }
}

/**
 * Crée l'instance Chart.js pour l'évolution des dépenses
 */
function createExpensesEvolutionChart(ctx, labels, datasets) {
    // Détruire le graphique existant
    if (expensesEvolutionChart) {
        expensesEvolutionChart.destroy();
    }
    
    expensesEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onHover: function(e, activeElements) {
                const chart = this;
                
                // Stocker les valeurs originales si pas déjà fait
                if (!chart._originalLineStyles) {
                    chart._originalLineStyles = chart.data.datasets.map(d => ({
                        borderWidth: d.borderWidth || 2,
                        pointRadius: d.pointRadius || 3
                    }));
                }
                
                if (activeElements.length > 0) {
                    const index = activeElements[0].datasetIndex;
                    
                    // Agrandir la série survolée
                    chart.data.datasets.forEach((dataset, i) => {
                        if (i === index) {
                            dataset.borderWidth = 4;
                            dataset.pointRadius = 6;
                        }
                    });
                    chart.update('none');
                } else {
                    // Restaurer les styles originaux
                    chart.data.datasets.forEach((dataset, i) => {
                        if (chart._originalLineStyles[i]) {
                            dataset.borderWidth = chart._originalLineStyles[i].borderWidth;
                            dataset.pointRadius = chart._originalLineStyles[i].pointRadius;
                        }
                    });
                    chart.update('none');
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    onClick: function(e, legendItem) {
                        // Comportement par défaut : toggle du dataset
                        const index = legendItem.datasetIndex;
                        const chart = this.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    },
                    onHover: function(e, legendItem) {
                        e.native.target.style.cursor = 'pointer';
                        if (legendItem) {
                            const chart = this.chart;
                            const index = legendItem.datasetIndex;
                            
                            // Stocker les valeurs originales si pas déjà fait
                            if (!chart._originalLineStyles) {
                                chart._originalLineStyles = chart.data.datasets.map(d => ({
                                    borderWidth: d.borderWidth || 2,
                                    pointRadius: d.pointRadius || 3
                                }));
                            }
                            
                            // Agrandir la série survolée
                            chart.data.datasets.forEach((dataset, i) => {
                                if (i === index) {
                                    dataset.borderWidth = 4;
                                    dataset.pointRadius = 6;
                                }
                            });
                            
                            // Agrandir le point dans la légende avec CSS
                            const legendItemElement = e.native.target.closest('li');
                            if (legendItemElement) {
                                const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                                if (pointElement) {
                                    pointElement.style.transform = 'scale(1.4)';
                                    pointElement.style.transition = 'transform 0.2s ease';
                                }
                            }
                            
                            chart.update('none');
                        }
                    },
                    onLeave: function(e, legendItem) {
                        e.native.target.style.cursor = 'default';
                        const chart = this.chart;
                        
                        // Restaurer les styles originaux
                        if (chart._originalLineStyles) {
                            chart.data.datasets.forEach((dataset, i) => {
                                if (chart._originalLineStyles[i]) {
                                    dataset.borderWidth = chart._originalLineStyles[i].borderWidth;
                                    dataset.pointRadius = chart._originalLineStyles[i].pointRadius;
                                }
                            });
                        }
                        
                        // Restaurer le point dans la légende
                        const legendItemElement = e.native.target.closest('li');
                        if (legendItemElement) {
                            const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                            if (pointElement) {
                                pointElement.style.transform = 'scale(1)';
                            }
                        }
                        
                        chart.update('none');
                    },
                    labels: {
                        padding: 18,
                        usePointStyle: true,
                        font: {
                            size: 13,
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        },
                        color: '#2C2C2C',
                        generateLabels: function(chart) {
                            const datasets = chart.data.datasets;
                            
                            return datasets.map((dataset, i) => {
                                const meta = chart.getDatasetMeta(i);
                                const isHidden = meta.hidden === true;
                                
                                // Convertir la couleur en rgba pour la transparence si nécessaire
                                let fillStyle = dataset.backgroundColor;
                                let strokeStyle = dataset.borderColor;
                                
                                if (isHidden) {
                                    // Convertir hex en rgba si nécessaire
                                    if (fillStyle && fillStyle.startsWith('#')) {
                                        const r = parseInt(fillStyle.slice(1, 3), 16);
                                        const g = parseInt(fillStyle.slice(3, 5), 16);
                                        const b = parseInt(fillStyle.slice(5, 7), 16);
                                        fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                    } else if (fillStyle && fillStyle.includes('rgb')) {
                                        fillStyle = fillStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                            const rgb = colors.split(',').map(c => c.trim());
                                            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                        });
                                    }
                                    
                                    if (strokeStyle && strokeStyle.startsWith('#')) {
                                        const r = parseInt(strokeStyle.slice(1, 3), 16);
                                        const g = parseInt(strokeStyle.slice(3, 5), 16);
                                        const b = parseInt(strokeStyle.slice(5, 7), 16);
                                        strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                    } else if (strokeStyle && strokeStyle.includes('rgb')) {
                                        strokeStyle = strokeStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                            const rgb = colors.split(',').map(c => c.trim());
                                            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                        });
                                    }
                                }
                                
                                return {
                                    text: dataset.label || '',
                                    fillStyle: fillStyle || dataset.backgroundColor,
                                    strokeStyle: strokeStyle || dataset.borderColor,
                                    lineWidth: dataset.borderWidth || 2,
                                    hidden: isHidden,
                                    datasetIndex: i,
                                    fontColor: isHidden ? 'rgba(44, 44, 44, 0.3)' : '#2C2C2C',
                                    textDecoration: 'none'
                                };
                            });
                        }
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
                    filter: function(tooltipItem) {
                        // Ne pas afficher les valeurs à 0
                        return tooltipItem.parsed.y > 0;
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
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
                    stacked: true,
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

