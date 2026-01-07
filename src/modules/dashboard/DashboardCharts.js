import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { formatCurrency } from '../shared/index.js';

// Variables pour stocker les instances de graphiques
let expensesChart = null;
let incomeChart = null;
let balanceChart = null;
let expensesEvolutionChart = null;
let incomeEvolutionChart = null;

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
    
    Object.keys(incomesByCategory).forEach(categoryId => {
        const category = data.categories.find(cat => cat.id === categoryId);
        if (category) {
            labels.push(category.name);
            values.push(incomesByCategory[categoryId]);
            colors.push(category.color);
        }
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
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="income-chart"></canvas>';
        const newCtx = document.getElementById('income-chart');
        incomeChart = new Chart(newCtx, {
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
        incomeChart = new Chart(ctx, {
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

/**
 * Crée le graphique d'évolution des dépenses par catégorie (12 derniers mois)
 */
export function renderExpensesEvolutionChart() {
    const ctx = document.getElementById('expenses-evolution-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    
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
    
    // Générer les 12 derniers mois
    const months = [];
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
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
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
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

/**
 * Crée le graphique d'évolution des revenus par catégorie (12 derniers mois)
 */
export function renderIncomeEvolutionChart() {
    const ctx = document.getElementById('income-evolution-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    
    // Obtenir toutes les catégories avec revenus
    const incomeCategoryIds = new Set();
    transactions.forEach(transaction => {
        if (transaction.amount > 0 && transaction.categoryId) {
            incomeCategoryIds.add(transaction.categoryId);
        }
    });
    
    const categoryIds = Array.from(incomeCategoryIds);
    
    // Si aucune catégorie avec revenus, afficher un message
    if (categoryIds.length === 0) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucun revenu disponible</p>';
        }
        if (incomeEvolutionChart) {
            incomeEvolutionChart.destroy();
            incomeEvolutionChart = null;
        }
        return;
    }
    
    // Générer les 12 derniers mois
    const months = [];
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
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
        if (transaction.amount > 0 && categoryIds.includes(transaction.categoryId)) {
            const transactionDate = new Date(transaction.date);
            const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
            if (categoryData[transaction.categoryId] && categoryData[transaction.categoryId][monthKey] !== undefined) {
                categoryData[transaction.categoryId][monthKey] += transaction.amount;
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
        if (incomeEvolutionChart) {
            incomeEvolutionChart.destroy();
            incomeEvolutionChart = null;
        }
        return;
    }
    
    // Restaurer le canvas si nécessaire
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="income-evolution-chart"></canvas>';
        const newCtx = document.getElementById('income-evolution-chart');
        createIncomeEvolutionChart(newCtx, months, datasets);
    } else {
        createIncomeEvolutionChart(ctx, months, datasets);
    }
}

/**
 * Crée l'instance Chart.js pour l'évolution des revenus
 */
function createIncomeEvolutionChart(ctx, labels, datasets) {
    // Détruire le graphique existant
    if (incomeEvolutionChart) {
        incomeEvolutionChart.destroy();
    }
    
    incomeEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
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
                    position: 'bottom',
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

