import { getAllTransactions } from '../../shared/index.js';
import { loadData } from '../../shared/index.js';
import { formatCurrency } from '../../shared/index.js';

// Variable pour stocker l'instance du graphique
let incomeChart = null;

/**
 * Éclaircit une couleur hexadécimale en la mélangeant avec du blanc
 * @param {string} hex - Couleur hexadécimale (ex: '#99BDB4')
 * @param {number} factor - Facteur d'éclaircissement (0-1, défaut: 0.6 pour 60% de blanc)
 * @returns {string} Couleur hexadécimale éclaircie
 */
function lightenColor(hex, factor = 0.6) {
    // Retirer le # si présent
    hex = hex.replace('#', '');
    
    // Convertir en RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Mélanger avec du blanc (255, 255, 255)
    const lightenedR = Math.floor(r + (255 - r) * factor);
    const lightenedG = Math.floor(g + (255 - g) * factor);
    const lightenedB = Math.floor(b + (255 - b) * factor);
    
    // Reconvertir en hexadécimal
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(lightenedR)}${toHex(lightenedG)}${toHex(lightenedB)}`;
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
                    borderColor: borderColors,
                    hoverBackgroundColor: colors, // Garder la même couleur au survol
                    hoverBorderColor: borderColors // Garder la même couleur de bordure au survol
                    // hoverBorderWidth n'est pas défini, sera géré par onHover
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: function(e, activeElements) {
                    const chart = this;
                    const dataset = chart.data.datasets[0];
                    
                    // Stocker la valeur originale de borderWidth si pas déjà fait
                    if (!chart._originalBorderWidth) {
                        chart._originalBorderWidth = typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 3;
                    }
                    
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        
                        // Créer un tableau de borderWidth avec bordure plus épaisse pour le segment survolé
                        const borderWidths = new Array(chart.data.labels.length).fill(chart._originalBorderWidth);
                        borderWidths[index] = 6; // Bordure plus épaisse au survol
                        dataset.borderWidth = borderWidths;
                        chart.update('active');
                    } else {
                        // Restaurer la bordure originale
                        if (typeof chart._originalBorderWidth === 'number') {
                            dataset.borderWidth = chart._originalBorderWidth;
                        } else {
                            dataset.borderWidth = 3;
                        }
                        chart.update('active');
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        onHover: function(e, legendItem) {
                            e.native.target.style.cursor = 'pointer';
                            if (legendItem) {
                                const chart = this.chart;
                                const index = legendItem.index;
                                const dataset = chart.data.datasets[0];
                                
                                // Stocker la valeur originale de borderWidth si pas déjà fait
                                if (!chart._originalBorderWidth) {
                                    chart._originalBorderWidth = typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 3;
                                }
                                
                                // Créer un tableau de borderWidth avec bordure plus épaisse pour le segment survolé
                                const borderWidths = new Array(chart.data.labels.length).fill(chart._originalBorderWidth);
                                borderWidths[index] = 6; // Bordure plus épaisse au survol
                                dataset.borderWidth = borderWidths;
                                
                                // Agrandir le point dans la légende avec CSS
                                const legendItemElement = e.native.target.closest('li');
                                if (legendItemElement) {
                                    const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                                    if (pointElement) {
                                        pointElement.style.transform = 'scale(1.4)';
                                        pointElement.style.transition = 'transform 0.2s ease';
                                    }
                                }
                                
                                chart.update('active');
                            }
                        },
                        onLeave: function(e, legendItem) {
                            e.native.target.style.cursor = 'default';
                            const chart = this.chart;
                            const dataset = chart.data.datasets[0];
                            
                            // Restaurer la bordure originale
                            if (chart._originalBorderWidth !== undefined) {
                                if (typeof chart._originalBorderWidth === 'number') {
                                    dataset.borderWidth = chart._originalBorderWidth;
                                } else {
                                    dataset.borderWidth = 3;
                                }
                            }
                            
                            // Restaurer le point dans la légende
                            const legendItemElement = e.native.target.closest('li');
                            if (legendItemElement) {
                                const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                                if (pointElement) {
                                    pointElement.style.transform = 'scale(1)';
                                }
                            }
                            
                            chart.update('active');
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
                                const data = chart.data;
                                const dataset = data.datasets[0];
                                const meta = chart.getDatasetMeta(0);
                                
                                return data.labels.map((label, i) => {
                                    const style = meta.controller.getStyle(i);
                                    const isHidden = !chart.getDataVisibility(i);
                                    
                                    // Convertir la couleur en rgba pour la transparence si nécessaire
                                    let fillStyle = style.backgroundColor;
                                    let strokeStyle = style.borderColor;
                                    
                                    if (isHidden) {
                                        // Convertir hex en rgba si nécessaire
                                        if (fillStyle.startsWith('#')) {
                                            const r = parseInt(fillStyle.slice(1, 3), 16);
                                            const g = parseInt(fillStyle.slice(3, 5), 16);
                                            const b = parseInt(fillStyle.slice(5, 7), 16);
                                            fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                        } else if (fillStyle.includes('rgb')) {
                                            fillStyle = fillStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                                const rgb = colors.split(',').map(c => c.trim());
                                                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                            });
                                        }
                                        
                                        if (strokeStyle.startsWith('#')) {
                                            const r = parseInt(strokeStyle.slice(1, 3), 16);
                                            const g = parseInt(strokeStyle.slice(3, 5), 16);
                                            const b = parseInt(strokeStyle.slice(5, 7), 16);
                                            strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                        } else if (strokeStyle.includes('rgb')) {
                                            strokeStyle = strokeStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                                const rgb = colors.split(',').map(c => c.trim());
                                                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                            });
                                        }
                                    }
                                    
                                    return {
                                        text: label,
                                        fillStyle: fillStyle,
                                        strokeStyle: strokeStyle,
                                        lineWidth: style.borderWidth,
                                        hidden: isHidden,
                                        index: i,
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
                    borderColor: borderColors,
                    hoverBackgroundColor: colors, // Garder la même couleur au survol
                    hoverBorderColor: borderColors // Garder la même couleur de bordure au survol
                    // hoverBorderWidth n'est pas défini, sera géré par onHover
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: function(e, activeElements) {
                    const chart = this;
                    const dataset = chart.data.datasets[0];
                    
                    // Stocker la valeur originale de borderWidth si pas déjà fait
                    if (!chart._originalBorderWidth) {
                        chart._originalBorderWidth = typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 3;
                    }
                    
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        
                        // Créer un tableau de borderWidth avec bordure plus épaisse pour le segment survolé
                        const borderWidths = new Array(chart.data.labels.length).fill(chart._originalBorderWidth);
                        borderWidths[index] = 6; // Bordure plus épaisse au survol
                        dataset.borderWidth = borderWidths;
                        chart.update('active');
                    } else {
                        // Restaurer la bordure originale
                        if (typeof chart._originalBorderWidth === 'number') {
                            dataset.borderWidth = chart._originalBorderWidth;
                        } else {
                            dataset.borderWidth = 3;
                        }
                        chart.update('active');
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        onHover: function(e, legendItem) {
                            e.native.target.style.cursor = 'pointer';
                            if (legendItem) {
                                const chart = this.chart;
                                const index = legendItem.index;
                                const dataset = chart.data.datasets[0];
                                
                                // Stocker la valeur originale de borderWidth si pas déjà fait
                                if (!chart._originalBorderWidth) {
                                    chart._originalBorderWidth = typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 3;
                                }
                                
                                // Créer un tableau de borderWidth avec bordure plus épaisse pour le segment survolé
                                const borderWidths = new Array(chart.data.labels.length).fill(chart._originalBorderWidth);
                                borderWidths[index] = 6; // Bordure plus épaisse au survol
                                dataset.borderWidth = borderWidths;
                                
                                // Agrandir le point dans la légende avec CSS
                                const legendItemElement = e.native.target.closest('li');
                                if (legendItemElement) {
                                    const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                                    if (pointElement) {
                                        pointElement.style.transform = 'scale(1.4)';
                                        pointElement.style.transition = 'transform 0.2s ease';
                                    }
                                }
                                
                                chart.update('active');
                            }
                        },
                        onLeave: function(e, legendItem) {
                            e.native.target.style.cursor = 'default';
                            const chart = this.chart;
                            const dataset = chart.data.datasets[0];
                            
                            // Restaurer la bordure originale
                            if (chart._originalBorderWidth !== undefined) {
                                if (typeof chart._originalBorderWidth === 'number') {
                                    dataset.borderWidth = chart._originalBorderWidth;
                                } else {
                                    dataset.borderWidth = 3;
                                }
                            }
                            
                            // Restaurer le point dans la légende
                            const legendItemElement = e.native.target.closest('li');
                            if (legendItemElement) {
                                const pointElement = legendItemElement.querySelector('span[style*="background"], span[style*="Background"]');
                                if (pointElement) {
                                    pointElement.style.transform = 'scale(1)';
                                }
                            }
                            
                            chart.update('active');
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
                                const data = chart.data;
                                const dataset = data.datasets[0];
                                const meta = chart.getDatasetMeta(0);
                                
                                return data.labels.map((label, i) => {
                                    const style = meta.controller.getStyle(i);
                                    const isHidden = !chart.getDataVisibility(i);
                                    
                                    // Convertir la couleur en rgba pour la transparence si nécessaire
                                    let fillStyle = style.backgroundColor;
                                    let strokeStyle = style.borderColor;
                                    
                                    if (isHidden) {
                                        // Convertir hex en rgba si nécessaire
                                        if (fillStyle.startsWith('#')) {
                                            const r = parseInt(fillStyle.slice(1, 3), 16);
                                            const g = parseInt(fillStyle.slice(3, 5), 16);
                                            const b = parseInt(fillStyle.slice(5, 7), 16);
                                            fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                        } else if (fillStyle.includes('rgb')) {
                                            fillStyle = fillStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                                const rgb = colors.split(',').map(c => c.trim());
                                                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                            });
                                        }
                                        
                                        if (strokeStyle.startsWith('#')) {
                                            const r = parseInt(strokeStyle.slice(1, 3), 16);
                                            const g = parseInt(strokeStyle.slice(3, 5), 16);
                                            const b = parseInt(strokeStyle.slice(5, 7), 16);
                                            strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                                        } else if (strokeStyle.includes('rgb')) {
                                            strokeStyle = strokeStyle.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
                                                const rgb = colors.split(',').map(c => c.trim());
                                                return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
                                            });
                                        }
                                    }
                                    
                                    return {
                                        text: label,
                                        fillStyle: fillStyle,
                                        strokeStyle: strokeStyle,
                                        lineWidth: style.borderWidth,
                                        hidden: isHidden,
                                        index: i,
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

