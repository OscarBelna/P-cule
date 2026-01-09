import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { escapeHtml, formatCurrency, formatDateLocal, parseDateLocal } from '../shared/index.js';

/**
 * Affiche le calendrier mensuel
 * @param {Date} currentDate - La date actuelle du calendrier
 * @param {Object} filters - Les filtres à appliquer
 */
export function renderCalendar(currentDate = new Date(), filters = { type: 'all', categoryId: null, showRecurring: true }) {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid || !monthYear) return;
    
    // Réinitialiser la grille pour la vue mensuelle
    grid.className = 'calendar-grid';
    grid.style.gridTemplateColumns = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Afficher le mois et l'année (avec capitalisation)
    const monthYearText = currentDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    });
    monthYear.textContent = monthYearText.charAt(0).toUpperCase() + monthYearText.slice(1);
    
    // Obtenir le premier jour du mois et le nombre de jours
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Ajuster pour que lundi = 0
    const adjustedStartingDay = (startingDayOfWeek + 6) % 7;
    
    // Obtenir toutes les transactions et les filtrer
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    // Appliquer les filtres
    let transactions = allTransactions.filter(transaction => {
        // Filtre par type
        if (filters.type === 'income' && transaction.amount <= 0) return false;
        if (filters.type === 'expense' && transaction.amount > 0) return false;
        
        // Filtre par catégorie
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        
        // Filtre récurrence
        if (!filters.showRecurring) {
            if (transaction.recurrence || transaction.originalId) return false;
        }
        
        return true;
    });
    
    // Grouper les transactions par date avec plus de détails
    const transactionsByDate = {};
    transactions.forEach(transaction => {
        const dateStr = transaction.date;
        if (!transactionsByDate[dateStr]) {
            transactionsByDate[dateStr] = { 
                income: false, 
                expense: false, 
                hasRecurring: false,
                totalIncome: 0,
                totalExpense: 0
            };
        }
        
        if (transaction.amount > 0) {
            transactionsByDate[dateStr].income = true;
            transactionsByDate[dateStr].totalIncome += transaction.amount;
        } else {
            transactionsByDate[dateStr].expense = true;
            transactionsByDate[dateStr].totalExpense += Math.abs(transaction.amount);
        }
        
        // Vérifier si transaction récurrente
        if (transaction.recurrence || transaction.originalId) {
            transactionsByDate[dateStr].hasRecurring = true;
        }
    });
    
    // En-têtes des jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    grid.innerHTML = dayHeaders.map(day => 
        `<div class="calendar-day-header">${day}</div>`
    ).join('');
    
    // Jours du mois précédent
    if (adjustedStartingDay > 0) {
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = adjustedStartingDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            grid.innerHTML += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
    }
    
    // Jours du mois actuel
    const today = new Date();
    const todayStr = formatDateLocal(today);
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const selectedDate = isCurrentMonth ? todayStr : null;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = transactionsByDate[dateStr];
        const isToday = isCurrentMonth && day === today.getDate();
        const isSelected = selectedDate !== null && dateStr === selectedDate;
        
        let indicators = '';
        if (dayData) {
            if (dayData.income) {
                indicators += '<div class="calendar-indicator income"></div>';
            }
            if (dayData.expense) {
                indicators += '<div class="calendar-indicator expense"></div>';
            }
            if (dayData.hasRecurring) {
                indicators += '<div class="calendar-indicator recurring" title="Transaction récurrente">🔄</div>';
            }
        }
        
        // Calculer l'intensité pour le style (optionnel, pour future amélioration)
        const intensity = dayData ? Math.min(1, (dayData.totalIncome + dayData.totalExpense) / 1000) : 0;
        
        grid.innerHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} calendar-day-animated" 
                 data-date="${dateStr}" 
                 style="${dayData ? `--intensity: ${intensity}` : ''}">
                <span class="calendar-day-number">${day}</span>
                ${indicators ? `<div class="calendar-day-indicators">${indicators}</div>` : ''}
            </div>
        `;
    }
    
    // Jours du mois suivant pour compléter la grille
    const totalCells = grid.children.length;
    const remainingCells = 42 - totalCells; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingCells; day++) {
        grid.innerHTML += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
    }
    
    // Ajouter les event listeners pour les clics
    grid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const date = dayEl.getAttribute('data-date');
            if (date) {
                // Retirer la sélection précédente
                grid.querySelectorAll('.calendar-day.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                // Ajouter la sélection au jour cliqué
                dayEl.classList.add('selected');
                showDayDetails(date);
            }
        });
    });
    
    // Afficher automatiquement les détails du jour en cours si c'est le mois actuel
    if (isCurrentMonth) {
        showDayDetails(todayStr);
    }
}

/**
 * Calcule le résumé mensuel
 */
function getMonthSummary(year, month) {
    const transactions = getAllTransactions();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    monthTransactions.forEach(t => {
        if (t.amount > 0) {
            totalIncome += t.amount;
        } else {
            totalExpense += Math.abs(t.amount);
        }
    });
    
    const balance = totalIncome - totalExpense;
    
    // Calculer le mois précédent pour comparaison
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthStart = new Date(prevYear, prevMonth, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0);
    
    const prevMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= prevMonthStart && tDate <= prevMonthEnd;
    });
    
    let prevTotalIncome = 0;
    let prevTotalExpense = 0;
    
    prevMonthTransactions.forEach(t => {
        if (t.amount > 0) {
            prevTotalIncome += t.amount;
        } else {
            prevTotalExpense += Math.abs(t.amount);
        }
    });
    
    const prevBalance = prevTotalIncome - prevTotalExpense;
    
    return {
        income: totalIncome,
        expense: totalExpense,
        balance: balance,
        prevIncome: prevTotalIncome,
        prevExpense: prevTotalExpense,
        prevBalance: prevBalance,
        incomeChange: prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0,
        expenseChange: prevTotalExpense > 0 ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 : 0,
        balanceChange: prevBalance !== 0 ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100 : 0
    };
}

/**
 * Calcule le résumé hebdomadaire
 */
function getWeekSummary(startDate) {
    const transactions = getAllTransactions();
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    
    // Trouver le lundi de la semaine
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1
    weekStart.setDate(weekStart.getDate() + diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= weekStart && tDate <= weekEnd;
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    weekTransactions.forEach(t => {
        if (t.amount > 0) {
            totalIncome += t.amount;
        } else {
            totalExpense += Math.abs(t.amount);
        }
    });
    
    return {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
        startDate: weekStart,
        endDate: weekEnd
    };
}

/**
 * Affiche le résumé mensuel
 */
export function renderMonthSummary(year, month) {
    const summaryContainer = document.getElementById('calendar-month-summary');
    if (!summaryContainer) return;
    
    const summary = getMonthSummary(year, month);
    
    const incomeChangeIcon = summary.incomeChange > 0 ? '↑' : summary.incomeChange < 0 ? '↓' : '→';
    const expenseChangeIcon = summary.expenseChange > 0 ? '↑' : summary.expenseChange < 0 ? '↓' : '→';
    const balanceChangeIcon = summary.balanceChange > 0 ? '↑' : summary.balanceChange < 0 ? '↓' : '→';
    
    summaryContainer.innerHTML = `
        <div class="calendar-summary-grid">
            <div class="calendar-summary-card income">
                <div class="calendar-summary-label">Revenus</div>
                <div class="calendar-summary-value">${formatCurrency(summary.income)}</div>
                <div class="calendar-summary-change ${summary.incomeChange >= 0 ? 'positive' : 'negative'}">
                    ${incomeChangeIcon} ${Math.abs(summary.incomeChange).toFixed(1)}%
                </div>
            </div>
            <div class="calendar-summary-card expense">
                <div class="calendar-summary-label">Dépenses</div>
                <div class="calendar-summary-value">${formatCurrency(summary.expense)}</div>
                <div class="calendar-summary-change ${summary.expenseChange >= 0 ? 'negative' : 'positive'}">
                    ${expenseChangeIcon} ${Math.abs(summary.expenseChange).toFixed(1)}%
                </div>
            </div>
            <div class="calendar-summary-card balance">
                <div class="calendar-summary-label">Solde</div>
                <div class="calendar-summary-value ${summary.balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.balance)}</div>
                <div class="calendar-summary-change ${summary.balanceChange >= 0 ? 'positive' : 'negative'}">
                    ${balanceChangeIcon} ${Math.abs(summary.balanceChange).toFixed(1)}%
                </div>
            </div>
        </div>
    `;
}

/**
 * Affiche la vue hebdomadaire
 */
export function renderWeekView(startDate, filters = { type: 'all', categoryId: null, showRecurring: true }) {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid || !monthYear) return;
    
    // Réinitialiser la grille pour la vue hebdomadaire
    grid.className = 'calendar-grid week-view-grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    
    // Calculer le lundi de la semaine
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Afficher la période
    const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    monthYear.textContent = `${startStr} - ${endStr}`;
    
    // Obtenir les transactions de la semaine
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    let transactions = allTransactions.filter(transaction => {
        const tDate = new Date(transaction.date);
        if (tDate < weekStart || tDate > weekEnd) return false;
        
        if (filters.type === 'income' && transaction.amount <= 0) return false;
        if (filters.type === 'expense' && transaction.amount > 0) return false;
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        if (!filters.showRecurring && (transaction.recurrence || transaction.originalId)) return false;
        
        return true;
    });
    
    // Grouper par jour
    const transactionsByDay = {};
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dateStr = formatDateLocal(day);
        transactionsByDay[dateStr] = {
            date: day,
            transactions: [],
            income: 0,
            expense: 0
        };
    }
    
    transactions.forEach(transaction => {
        const dateStr = transaction.date;
        if (transactionsByDay[dateStr]) {
            transactionsByDay[dateStr].transactions.push(transaction);
            if (transaction.amount > 0) {
                transactionsByDay[dateStr].income += transaction.amount;
            } else {
                transactionsByDay[dateStr].expense += Math.abs(transaction.amount);
            }
        }
    });
    
    // Afficher la semaine
    grid.innerHTML = '';
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    Object.values(transactionsByDay).forEach((dayData, index) => {
        const date = dayData.date;
        const dateStr = formatDateLocal(date);
        const isToday = formatDateLocal(new Date()) === dateStr;
        const maxAmount = Math.max(dayData.income, dayData.expense);
        const incomeHeight = maxAmount > 0 ? (dayData.income / maxAmount) * 100 : 0;
        const expenseHeight = maxAmount > 0 ? (dayData.expense / maxAmount) * 100 : 0;
        
        grid.innerHTML += `
            <div class="calendar-week-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="week-day-header">
                    <div class="week-day-name">${dayNames[index]}</div>
                    <div class="week-day-number">${date.getDate()}</div>
                </div>
                <div class="week-day-chart">
                    <div class="week-day-bar income" style="height: ${incomeHeight}%"></div>
                    <div class="week-day-bar expense" style="height: ${expenseHeight}%"></div>
                </div>
                <div class="week-day-amounts">
                    <div class="week-day-income">+${formatCurrency(dayData.income)}</div>
                    <div class="week-day-expense">-${formatCurrency(dayData.expense)}</div>
                </div>
                <div class="week-day-transactions">
                    ${dayData.transactions.slice(0, 3).map(t => {
                        const category = data.categories.find(cat => cat.id === t.categoryId);
                        const categoryName = category ? category.name : 'Catégorie supprimée';
                        const isRecurring = t.recurrence || t.originalId;
                        return `
                            <div class="week-transaction-item">
                                <span class="week-transaction-category">${escapeHtml(categoryName)}</span>
                                <span class="week-transaction-amount ${t.amount > 0 ? 'income' : 'expense'}">
                                    ${t.amount > 0 ? '+' : ''}${formatCurrency(t.amount)}
                                </span>
                                ${isRecurring ? '<span class="week-transaction-recurring">🔄</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                    ${dayData.transactions.length > 3 ? `<div class="week-transaction-more">+${dayData.transactions.length - 3} autres</div>` : ''}
                </div>
            </div>
        `;
    });
    
    // Ajouter les event listeners
    grid.querySelectorAll('.calendar-week-day').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const date = dayEl.getAttribute('data-date');
            if (date) {
                showDayDetails(date);
            }
        });
    });
    
    // Afficher le résumé hebdomadaire
    const weekSummary = getWeekSummary(startDate);
    const summaryContainer = document.getElementById('calendar-week-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="week-summary">
                <div class="week-summary-item">
                    <span>Revenus:</span>
                    <span class="income">${formatCurrency(weekSummary.income)}</span>
                </div>
                <div class="week-summary-item">
                    <span>Dépenses:</span>
                    <span class="expense">${formatCurrency(weekSummary.expense)}</span>
                </div>
                <div class="week-summary-item highlight">
                    <span>Solde:</span>
                    <span class="${weekSummary.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(weekSummary.balance)}</span>
                </div>
            </div>
        `;
    }
}

/**
 * Affiche la vue Heatmap annuelle
 */
export function renderYearView(year, filters = { type: 'all', categoryId: null, showRecurring: true }) {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid || !monthYear) return;
    
    monthYear.textContent = year.toString();
    
    // Obtenir toutes les transactions de l'année
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    let transactions = allTransactions.filter(transaction => {
        const tDate = new Date(transaction.date);
        if (tDate.getFullYear() !== year) return false;
        
        if (filters.type === 'income' && transaction.amount <= 0) return false;
        if (filters.type === 'expense' && transaction.amount > 0) return false;
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        if (!filters.showRecurring && (transaction.recurrence || transaction.originalId)) return false;
        
        return true;
    });
    
    // Calculer les dépenses par jour (uniquement les montants négatifs)
    const dailyExpenses = {};
    transactions.forEach(transaction => {
        // Ne prendre que les dépenses (montants négatifs)
        if (transaction.amount < 0) {
            const dateStr = transaction.date;
            if (!dailyExpenses[dateStr]) {
                dailyExpenses[dateStr] = 0;
            }
            dailyExpenses[dateStr] += Math.abs(transaction.amount);
        }
    });
    
    // Trouver le maximum de dépenses pour l'intensité
    const maxExpense = Math.max(...Object.values(dailyExpenses), 1);
    
    // Créer la heatmap style GitHub - structure par semaines de l'année
    grid.className = 'calendar-grid year-heatmap-grid';
    grid.style.gridTemplateColumns = 'auto repeat(53, 1fr)';
    grid.innerHTML = '';
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Calculer le premier lundi de l'année
    const yearStart = new Date(year, 0, 1);
    const firstMonday = new Date(yearStart);
    const dayOfWeek = yearStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstMonday.setDate(yearStart.getDate() + diff);
    
    // Calculer le dernier dimanche de l'année
    const yearEnd = new Date(year, 11, 31);
    const lastSunday = new Date(yearEnd);
    const lastDayOfWeek = yearEnd.getDay();
    const diffToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    lastSunday.setDate(yearEnd.getDate() + diffToSunday);
    
    // Calculer le nombre de semaines
    const weeksDiff = Math.ceil((lastSunday - firstMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const totalWeeks = Math.min(weeksDiff, 53);
    
    // En-tête avec mois (53 colonnes pour les semaines)
    grid.innerHTML += '<div class="year-header"></div>';
    
    // Créer un mapping des semaines aux mois pour l'en-tête
    const weekToMonth = {};
    for (let week = 0; week < totalWeeks; week++) {
        const weekDate = new Date(firstMonday);
        weekDate.setDate(firstMonday.getDate() + (week * 7));
        weekToMonth[week] = weekDate.getMonth();
    }
    
    // Afficher les en-têtes de mois (regrouper les semaines par mois)
    let currentMonth = -1;
    for (let week = 0; week < totalWeeks; week++) {
        const month = weekToMonth[week];
        if (month !== currentMonth) {
            const monthSpan = 1; // On affichera le mois sur la première semaine de chaque mois
            grid.innerHTML += `<div class="year-month-header" style="grid-column: ${week + 2} / span ${monthSpan}">${monthNames[month]}</div>`;
            currentMonth = month;
        } else {
            grid.innerHTML += '<div class="year-month-header" style="display: none;"></div>';
        }
    }
    
    // Générer les jours de l'année par semaine
    for (let week = 0; week < totalWeeks; week++) {
        // Numéro de semaine (optionnel, peut être masqué)
        grid.innerHTML += `<div class="year-week-number">${week + 1}</div>`;
        
        // Jours de la semaine (7 jours)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const currentDate = new Date(firstMonday);
            currentDate.setDate(firstMonday.getDate() + (week * 7) + dayOfWeek);
            
            // Vérifier si la date est dans l'année
            if (currentDate.getFullYear() === year) {
                const dateStr = formatDateLocal(currentDate);
                const expense = dailyExpenses[dateStr] || 0;
                const intensity = maxExpense > 0 ? expense / maxExpense : 0;
                const isToday = formatDateLocal(new Date()) === dateStr;
                
                // Calculer la couleur rouge basée sur l'intensité des dépenses
                // Échelle de rouge : transparent -> rouge très clair -> rouge clair -> rouge moyen -> rouge foncé
                let redColor;
                if (intensity === 0) {
                    redColor = 'var(--background)';
                } else if (intensity < 0.2) {
                    // Rouge très clair (peu de dépenses)
                    redColor = `rgba(254, 226, 226, ${0.4 + intensity * 2})`;
                } else if (intensity < 0.4) {
                    // Rouge clair
                    redColor = `rgba(252, 165, 165, ${0.5 + intensity * 1.25})`;
                } else if (intensity < 0.6) {
                    // Rouge moyen
                    redColor = `rgba(248, 113, 113, ${0.6 + intensity * 0.67})`;
                } else if (intensity < 0.8) {
                    // Rouge foncé
                    redColor = `rgba(239, 68, 68, ${0.7 + intensity * 0.375})`;
                } else {
                    // Rouge très foncé (beaucoup de dépenses)
                    redColor = `rgba(220, 38, 38, ${0.8 + intensity * 0.25})`;
                }
                
                grid.innerHTML += `
                    <div class="year-day ${isToday ? 'today' : ''} ${expense > 0 ? 'has-expense' : ''}" 
                         data-date="${dateStr}"
                         style="--expense-intensity: ${intensity}; background-color: ${redColor};"
                         title="${dateStr}: ${expense > 0 ? formatCurrency(expense) + ' de dépenses' : 'Aucune dépense'}">
                    </div>
                `;
            } else {
                grid.innerHTML += '<div class="year-day empty"></div>';
            }
        }
    }
    
    // Ajouter les event listeners
    grid.querySelectorAll('.year-day:not(.empty)').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const date = dayEl.getAttribute('data-date');
            if (date) {
                // Basculer en vue mensuelle pour cette date
                const dateObj = new Date(date);
                // Cette fonction sera appelée depuis CalendarController
            }
        });
    });
    
    // Afficher les statistiques annuelles
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        if (t.amount > 0) {
            totalIncome += t.amount;
        } else {
            totalExpense += Math.abs(t.amount);
        }
    });
    
    const yearSummary = document.getElementById('calendar-year-summary');
    if (yearSummary) {
        yearSummary.innerHTML = `
            <div class="year-summary">
                <div class="year-summary-item">
                    <span>Revenus:</span>
                    <span class="income">${formatCurrency(totalIncome)}</span>
                </div>
                <div class="year-summary-item">
                    <span>Dépenses:</span>
                    <span class="expense">${formatCurrency(totalExpense)}</span>
                </div>
                <div class="year-summary-item">
                    <span>Solde:</span>
                    <span class="${totalIncome - totalExpense >= 0 ? 'income' : 'expense'}">${formatCurrency(totalIncome - totalExpense)}</span>
                </div>
            </div>
            <div class="year-heatmap-legend">
                <div class="year-legend-label">Intensité des dépenses:</div>
                <div class="year-legend-scale">
                    <div class="year-legend-item" style="background-color: var(--background);" title="Aucune dépense">Moins</div>
                    <div class="year-legend-item" style="background-color: rgba(254, 226, 226, 0.6);" title="Peu de dépenses"></div>
                    <div class="year-legend-item" style="background-color: rgba(252, 165, 165, 0.75);" title="Dépenses modérées"></div>
                    <div class="year-legend-item" style="background-color: rgba(248, 113, 113, 0.9);" title="Dépenses importantes"></div>
                    <div class="year-legend-item" style="background-color: rgba(239, 68, 68, 1);" title="Dépenses très importantes"></div>
                    <div class="year-legend-item" style="background-color: rgba(220, 38, 38, 1);" title="Dépenses maximales">Plus</div>
                </div>
            </div>
        `;
    }
}

/**
 * Affiche les détails d'un jour
 */
export function showDayDetails(dateStr) {
    const detailsCard = document.getElementById('day-details');
    const detailsTitle = document.getElementById('day-details-title');
    const transactionsList = document.getElementById('day-transactions-list');
    
    if (!detailsCard || !detailsTitle || !transactionsList) return;
    
    const transactions = getAllTransactions();
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const data = loadData();
    
    if (dayTransactions.length === 0) {
        detailsCard.style.display = 'none';
        return;
    }
    
    const date = new Date(dateStr);
    detailsTitle.textContent = date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Calculer les totaux du jour
    let dayIncome = 0;
    let dayExpense = 0;
    dayTransactions.forEach(t => {
        if (t.amount > 0) {
            dayIncome += t.amount;
        } else {
            dayExpense += Math.abs(t.amount);
        }
    });
    
    // Trier par montant (dépenses d'abord, puis revenus)
    dayTransactions.sort((a, b) => a.amount - b.amount);
    
    transactionsList.innerHTML = `
        <div class="day-summary">
            <div class="day-summary-item">
                <span>Revenus:</span>
                <span class="income">${formatCurrency(dayIncome)}</span>
            </div>
            <div class="day-summary-item">
                <span>Dépenses:</span>
                <span class="expense">${formatCurrency(dayExpense)}</span>
            </div>
            <div class="day-summary-item highlight">
                <span>Solde:</span>
                <span class="${dayIncome - dayExpense >= 0 ? 'income' : 'expense'}">${formatCurrency(dayIncome - dayExpense)}</span>
            </div>
        </div>
        <div class="day-transactions-list">
            ${dayTransactions.map(transaction => {
                const category = data.categories.find(cat => cat.id === transaction.categoryId);
                const categoryColor = category ? category.color : '#64748b';
                const categoryName = category ? category.name : 'Catégorie supprimée';
                const isIncome = transaction.amount > 0;
                const isRecurring = transaction.recurrence || transaction.originalId;
                
                return `
                    <div class="day-transaction-item">
                        <div class="day-transaction-info">
                            <div class="day-transaction-color" style="background-color: ${categoryColor}"></div>
                            <div class="day-transaction-details">
                                <div class="day-transaction-category">
                                    ${escapeHtml(categoryName)}
                                    ${isRecurring ? '<span class="recurring-badge" title="Transaction récurrente">🔄</span>' : ''}
                                </div>
                                ${transaction.description ? `<div class="day-transaction-description">${escapeHtml(transaction.description)}</div>` : ''}
                            </div>
                        </div>
                        <div class="day-transaction-amount ${isIncome ? 'income' : 'expense'}">
                            ${isIncome ? '+' : ''}${formatCurrency(transaction.amount)}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    detailsCard.style.display = 'block';
}

/**
 * Affiche les détails d'une semaine
 */
export function showWeekDetails(startDate) {
    const detailsCard = document.getElementById('day-details');
    const detailsTitle = document.getElementById('day-details-title');
    const transactionsList = document.getElementById('day-transactions-list');
    
    if (!detailsCard || !detailsTitle || !transactionsList) return;
    
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const transactions = getAllTransactions();
    const weekTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= weekStart && tDate <= weekEnd;
    });
    
    const data = loadData();
    
    // Grouper par jour
    const transactionsByDay = {};
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dateStr = formatDateLocal(day);
        transactionsByDay[dateStr] = [];
    }
    
    weekTransactions.forEach(t => {
        if (transactionsByDay[t.date]) {
            transactionsByDay[t.date].push(t);
        }
    });
    
    const weekSummary = getWeekSummary(startDate);
    
    detailsTitle.textContent = `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    transactionsList.innerHTML = `
        <div class="week-details-summary">
            <div class="week-details-item">
                <span>Revenus:</span>
                <span class="income">${formatCurrency(weekSummary.income)}</span>
            </div>
            <div class="week-details-item">
                <span>Dépenses:</span>
                <span class="expense">${formatCurrency(weekSummary.expense)}</span>
            </div>
            <div class="week-details-item highlight">
                <span>Solde:</span>
                <span class="${weekSummary.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(weekSummary.balance)}</span>
            </div>
        </div>
        <div class="week-details-days">
            ${Object.entries(transactionsByDay).map(([dateStr, dayTransactions]) => {
                const date = new Date(dateStr);
                const dayName = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];
                let dayIncome = 0;
                let dayExpense = 0;
                
                dayTransactions.forEach(t => {
                    if (t.amount > 0) {
                        dayIncome += t.amount;
                    } else {
                        dayExpense += Math.abs(t.amount);
                    }
                });
                
                return `
                    <div class="week-details-day">
                        <div class="week-details-day-header">
                            <span class="week-details-day-name">${dayName} ${date.getDate()}</span>
                            <span class="week-details-day-balance ${dayIncome - dayExpense >= 0 ? 'income' : 'expense'}">
                                ${formatCurrency(dayIncome - dayExpense)}
                            </span>
                        </div>
                        <div class="week-details-day-transactions">
                            ${dayTransactions.length > 0 ? dayTransactions.map(t => {
                                const category = data.categories.find(cat => cat.id === t.categoryId);
                                const categoryName = category ? category.name : 'Catégorie supprimée';
                                const isRecurring = t.recurrence || t.originalId;
                                return `
                                    <div class="week-details-transaction">
                                        <span class="week-details-transaction-category">${escapeHtml(categoryName)}</span>
                                        ${isRecurring ? '<span class="recurring-badge">🔄</span>' : ''}
                                        <span class="week-details-transaction-amount ${t.amount > 0 ? 'income' : 'expense'}">
                                            ${t.amount > 0 ? '+' : ''}${formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                `;
                            }).join('') : '<div class="week-details-no-transactions">Aucune transaction</div>'}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    detailsCard.style.display = 'block';
}

/**
 * Affiche la légende interactive
 */
export function renderLegend(filters) {
    const legendContainer = document.getElementById('calendar-legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = `
        <div class="calendar-legend-title">Légende</div>
        <div class="calendar-legend-items">
            <div class="calendar-legend-item ${filters.type === 'income' ? 'active' : ''}" data-filter-type="income">
                <div class="calendar-legend-indicator income"></div>
                <span>Revenus</span>
            </div>
            <div class="calendar-legend-item ${filters.type === 'expense' ? 'active' : ''}" data-filter-type="expense">
                <div class="calendar-legend-indicator expense"></div>
                <span>Dépenses</span>
            </div>
            <div class="calendar-legend-item ${filters.showRecurring ? 'active' : ''}" data-filter-type="recurring">
                <div class="calendar-legend-indicator recurring">🔄</div>
                <span>Récurrentes</span>
            </div>
        </div>
    `;
    
    // Reconnecter les event listeners (sera fait dans initCalendar)
}
