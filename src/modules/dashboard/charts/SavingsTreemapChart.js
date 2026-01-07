import { loadData } from '../../shared/index.js';
import { getAllTransactions } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

// Variable pour stocker l'instance du graphique
let savingsTreemapChart = null;
let currentTreemapMonth = new Date();

/**
 * Initialise le contrôleur du Treemap avec les boutons de navigation
 */
export function initSavingsTreemap() {
    const prevBtn = document.getElementById('treemap-prev-month');
    const nextBtn = document.getElementById('treemap-next-month');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentTreemapMonth.setMonth(currentTreemapMonth.getMonth() - 1);
            renderSavingsTreemap();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentTreemapMonth.setMonth(currentTreemapMonth.getMonth() + 1);
            renderSavingsTreemap();
        });
    }
    
    renderSavingsTreemap();
}

/**
 * Met à jour le label du mois actuel
 */
function updateMonthLabel() {
    const label = document.getElementById('treemap-current-month');
    if (label) {
        label.textContent = currentTreemapMonth.toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
}

/**
 * Calcule les économies du mois sélectionné
 */
function calculateSavingsForMonth(year, month) {
    const transactions = getAllTransactions();
    
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
    
    let income = 0;
    let expenses = 0;
    
    monthTransactions.forEach(t => {
        if (t.amount > 0) {
            income += t.amount;
        } else {
            expenses += Math.abs(t.amount);
        }
    });
    
    return income - expenses;
}

/**
 * Génère une couleur basée sur l'index et le nombre total
 */
function generateColor(index, total) {
    const colors = [
        { bg: 'rgba(153, 189, 180, 0.85)', border: '#99BDB4' },  // Vert Sauge
        { bg: 'rgba(242, 177, 160, 0.85)', border: '#F2B1A0' },  // Rose Corail
        { bg: 'rgba(181, 211, 204, 0.85)', border: '#B5D3CC' },  // Vert Sauge clair
        { bg: 'rgba(248, 201, 187, 0.85)', border: '#F8C9BB' },  // Rose Corail clair
        { bg: 'rgba(127, 168, 157, 0.85)', border: '#7FA89D' },  // Vert Sauge foncé
        { bg: 'rgba(232, 154, 133, 0.85)', border: '#E89A85' },  // Rose Corail foncé
    ];
    
    return colors[index % colors.length];
}

/**
 * Crée le graphique Treemap des économies réparties
 */
export function renderSavingsTreemap() {
    const ctx = document.getElementById('savings-treemap-chart');
    if (!ctx) return;
    
    updateMonthLabel();
    
    const data = loadData();
    const year = currentTreemapMonth.getFullYear();
    const month = currentTreemapMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // S'assurer que savingsAllocations existe
    if (!data.savingsAllocations) {
        data.savingsAllocations = {};
    }
    
    // Récupérer les allocations pour ce mois
    const allocations = data.savingsAllocations[monthKey] || [];
    
    // Calculer les économies du mois
    const totalSavings = calculateSavingsForMonth(year, month);
    
    // Si pas d'allocations ou économies négatives
    if (allocations.length === 0 || totalSavings <= 0) {
        const parent = ctx.parentElement;
        if (parent) {
            const messageClass = totalSavings <= 0 ? 'info-message' : 'placeholder';
            const message = totalSavings <= 0 
                ? 'Aucune économie ce mois-ci'
                : 'Aucune répartition définie pour ce mois';
            parent.innerHTML = `<p class="${messageClass}">${message}</p>`;
        }
        if (savingsTreemapChart) {
            savingsTreemapChart.destroy();
            savingsTreemapChart = null;
        }
        return;
    }
    
    // Filtrer les catégories de type 'savings'
    const savingsCategories = data.categories.filter(c => c.type === 'savings');
    
    // Agréger les allocations par catégorie
    const aggregatedAllocations = {};
    allocations.forEach(alloc => {
        if (alloc.amount > 0) {
            if (!aggregatedAllocations[alloc.categoryId]) {
                aggregatedAllocations[alloc.categoryId] = 0;
            }
            aggregatedAllocations[alloc.categoryId] += alloc.amount;
        }
    });
    
    // Préparer les données pour le Treemap (triées par ordre décroissant de montant)
    const treemapData = Object.entries(aggregatedAllocations)
        .sort(([, amountA], [, amountB]) => amountB - amountA) // Tri décroissant
        .map(([categoryId, totalAmount], index) => {
            const category = savingsCategories.find(c => c.id === categoryId);
            if (!category) return null;
            
            const colorScheme = generateColor(index, Object.keys(aggregatedAllocations).length);
            
            return {
                label: category.name,
                value: totalAmount,
                backgroundColor: colorScheme.bg,
                borderColor: colorScheme.border,
                categoryColor: category.color
            };
        })
        .filter(item => item !== null);
    
    if (treemapData.length === 0) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="placeholder">Aucune catégorie d\'économie valide</p>';
        }
        if (savingsTreemapChart) {
            savingsTreemapChart.destroy();
            savingsTreemapChart = null;
        }
        return;
    }
    
    // Restaurer le canvas si nécessaire
    if (ctx.parentElement.innerHTML.includes('<p')) {
        ctx.parentElement.innerHTML = '<canvas id="savings-treemap-chart"></canvas>';
        const newCtx = document.getElementById('savings-treemap-chart');
        createTreemapChart(newCtx, treemapData);
    } else {
        createTreemapChart(ctx, treemapData);
    }
}

/**
 * Crée l'instance Chart.js Treemap
 */
function createTreemapChart(ctx, data) {
    // Détruire le graphique existant
    if (savingsTreemapChart) {
        savingsTreemapChart.destroy();
    }
    
    savingsTreemapChart = new Chart(ctx, {
        type: 'treemap',
        data: {
            datasets: [{
                tree: data.map(item => ({ value: item.value })),
                key: 'value',
                labels: {
                    display: true,
                    formatter: (ctx) => {
                        if (ctx.type !== 'data') return '';
                        const item = data[ctx.dataIndex];
                        return [item.label, formatCurrency(item.value)];
                    },
                    color: '#2C2C2C',
                    font: {
                        size: 13,
                        weight: '600',
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    },
                    align: 'center',
                    position: 'middle'
                },
                backgroundColor: (ctx) => {
                    if (ctx.type !== 'data') return 'transparent';
                    return data[ctx.dataIndex].backgroundColor;
                },
                borderColor: (ctx) => {
                    if (ctx.type !== 'data') return 'transparent';
                    return data[ctx.dataIndex].borderColor;
                },
                borderWidth: 3,
                borderRadius: 16,
                spacing: 2,
                hoverBackgroundColor: (ctx) => {
                    if (ctx.type !== 'data') return 'transparent';
                    // Augmenter légèrement l'opacité au survol
                    const color = data[ctx.dataIndex].backgroundColor;
                    return color.replace('0.85', '1');
                },
                hoverBorderWidth: 4
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
                    displayColors: true,
                    callbacks: {
                        title: (context) => {
                            return data[context[0].dataIndex].label;
                        },
                        label: (context) => {
                            const item = data[context.dataIndex];
                            return `Montant : ${formatCurrency(item.value)}`;
                        },
                        labelColor: (context) => {
                            return {
                                borderColor: data[context.dataIndex].borderColor,
                                backgroundColor: data[context.dataIndex].backgroundColor,
                                borderWidth: 2,
                                borderRadius: 4
                            };
                        }
                    }
                }
            }
        }
    });
}

// Exporter pour utilisation globale et permettre la synchronisation entre modules
window.renderSavingsTreemap = renderSavingsTreemap;

/**
 * Synchronise le mois sélectionné avec la page Objectifs
 */
export function syncTreemapMonth(year, month) {
    currentTreemapMonth = new Date(year, month, 1);
    renderSavingsTreemap();
}

