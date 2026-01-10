import { getAllTransactions, populateCategorySelect } from '../shared/index.js';
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
                showDayDetails(date, filters);
            }
        });
    });
    
    // Afficher automatiquement les détails du jour en cours si c'est le mois actuel
    if (isCurrentMonth) {
        showDayDetails(todayStr, filters);
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
 * Calcule le lundi d'une semaine à partir d'une date
 */
function getMondayOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + diff);
    return d;
}

/**
 * Affiche la vue hebdomadaire avec bilans multiples
 */
export function renderWeekView(startDate, filters = { type: 'all', categoryId: null, showRecurring: true }) {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid || !monthYear) return;
    
    // Calculer la période : 3 mois (1 mois avant, mois actuel, 1 mois après)
    const periodStart = new Date(startDate);
    periodStart.setMonth(periodStart.getMonth() - 1);
    periodStart.setDate(1); // Premier jour du mois
    periodStart.setHours(0, 0, 0, 0);
    
    const periodEnd = new Date(startDate);
    periodEnd.setMonth(periodEnd.getMonth() + 2);
    periodEnd.setDate(0); // Dernier jour du mois précédent (donc dernier jour du mois actuel + 1)
    periodEnd.setHours(23, 59, 59, 999);
    
    // Obtenir le lundi de la première semaine de la période
    const firstMonday = getMondayOfWeek(periodStart);
    
    // Générer toutes les semaines de la période
    const weeks = [];
    let currentWeekStart = new Date(firstMonday);
    
    while (currentWeekStart <= periodEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Ne garder que les semaines qui chevauchent la période
        if (weekEnd >= periodStart && currentWeekStart <= periodEnd) {
            weeks.push({
                start: new Date(currentWeekStart),
                end: new Date(weekEnd)
            });
        }
        
        // Passer à la semaine suivante
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Obtenir toutes les transactions de la période
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    // Filtrer les transactions selon les filtres
    let filteredTransactions = allTransactions.filter(transaction => {
        const tDate = new Date(transaction.date);
        if (tDate < periodStart || tDate > periodEnd) return false;
        
        if (filters.type === 'income' && transaction.amount <= 0) return false;
        if (filters.type === 'expense' && transaction.amount > 0) return false;
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        if (!filters.showRecurring && (transaction.recurrence || transaction.originalId)) return false;
        
        return true;
    });
    
    // Calculer les totaux pour chaque semaine
    const weeksData = weeks.map(week => {
        const weekTransactions = filteredTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= week.start && tDate <= week.end;
        });
        
        let income = 0;
        let expense = 0;
        
        weekTransactions.forEach(t => {
            if (t.amount > 0) {
                income += t.amount;
            } else {
                expense += Math.abs(t.amount);
            }
        });
        
        const balance = income - expense;
        
        // Formater la période de la semaine
        const startStr = week.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        const endStr = week.end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        const period = week.start.getMonth() === week.end.getMonth() 
            ? `${week.start.getDate()}-${week.end.getDate()} ${startStr.split(' ')[1]}`
            : `${startStr} - ${endStr}`;
        
        return {
            start: week.start,
            end: week.end,
            startDateStr: formatDateLocal(week.start),
            period,
            income,
            expense,
            balance,
            transactions: weekTransactions
        };
    });
    
    // Afficher la période complète
    const periodStartStr = periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const periodEndStr = periodEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    monthYear.textContent = periodStart.getFullYear() === periodEnd.getFullYear() && periodStart.getMonth() === periodEnd.getMonth()
        ? periodStartStr.charAt(0).toUpperCase() + periodStartStr.slice(1)
        : `${periodStartStr.charAt(0).toUpperCase() + periodStartStr.slice(1)} - ${periodEndStr.charAt(0).toUpperCase() + periodEndStr.slice(1)}`;
    
    // Afficher les semaines en grille
    grid.innerHTML = '';
    grid.className = 'calendar-grid weeks-grid';
    grid.style.gridTemplateColumns = '';
    
    weeksData.forEach(weekData => {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card';
        weekCard.setAttribute('data-week-start', weekData.startDateStr);
        
        weekCard.innerHTML = `
            <div class="week-card-header">
                <div class="week-card-period">${weekData.period}</div>
            </div>
            <div class="week-card-summary">
                <div class="week-card-item income">
                    <span class="week-card-label">Revenus</span>
                    <span class="week-card-value income">${formatCurrency(weekData.income)}</span>
                </div>
                <div class="week-card-item expense">
                    <span class="week-card-label">Dépenses</span>
                    <span class="week-card-value expense">${formatCurrency(weekData.expense)}</span>
                </div>
                <div class="week-card-item balance">
                    <span class="week-card-label">Solde</span>
                    <span class="week-card-value ${weekData.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(weekData.balance)}</span>
                </div>
            </div>
        `;
        
        // Ajouter l'event listener pour le clic
        weekCard.addEventListener('click', () => {
            showWeekDetails(weekData.startDateStr, filters);
        });
        
        grid.appendChild(weekCard);
    });
    
    // Masquer le résumé hebdomadaire
    const summaryContainer = document.getElementById('calendar-week-summary');
    if (summaryContainer) {
        summaryContainer.style.display = 'none';
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
export function showDayDetails(dateStr, filters = { type: 'all', categoryId: null, showRecurring: true }) {
    const detailsCard = document.getElementById('day-details');
    const detailsTitle = document.getElementById('day-details-title');
    const transactionsList = document.getElementById('day-transactions-list');
    
    if (!detailsCard || !detailsTitle || !transactionsList) return;
    
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    // Appliquer les filtres - afficher toutes les transactions visibles sur la case du calendrier
    // Le filtre récurrent ne doit pas exclure les non-récurrentes dans les détails
    let transactions = allTransactions.filter(transaction => {
        // Filtre par date
        if (transaction.date !== dateStr) return false;
        
        // Filtre par type
        if (filters.type === 'income' && transaction.amount <= 0) return false;
        if (filters.type === 'expense' && transaction.amount > 0) return false;
        
        // Filtre par catégorie
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        
        // Le filtre récurrence n'est pas appliqué dans les détails du jour
        // On affiche toujours toutes les transactions correspondant aux autres filtres
        // (type et catégorie), qu'elles soient récurrentes ou non
        
        return true;
    });
    
    const dayTransactions = transactions;
    
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
    
    // Séparer les transactions en revenus et dépenses
    const incomeTransactions = dayTransactions.filter(t => t.amount > 0).sort((a, b) => b.amount - a.amount);
    const expenseTransactions = dayTransactions.filter(t => t.amount <= 0).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    
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
                <span>Solde du jour:</span>
                <span class="${dayIncome - dayExpense >= 0 ? 'income' : 'expense'}">${formatCurrency(dayIncome - dayExpense)}</span>
            </div>
        </div>
        
        ${incomeTransactions.length > 0 ? `
            <div class="day-transactions-section">
                <div class="day-transactions-section-header income-header">
                    <span class="day-transactions-section-title">Revenus</span>
                    <span class="day-transactions-section-total income">${formatCurrency(dayIncome)}</span>
                </div>
                <div class="day-transactions-list income-list">
                    ${incomeTransactions.map(transaction => {
                        const category = data.categories.find(cat => cat.id === transaction.categoryId);
                        const categoryColor = category ? category.color : '#64748b';
                        const categoryName = category ? category.name : 'Catégorie supprimée';
                        const isRecurring = transaction.recurrence || transaction.originalId;
                        
                        return `
                            <div class="day-transaction-item income-item">
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
                                <div class="day-transaction-amount income">
                                    +${formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
        
        ${expenseTransactions.length > 0 ? `
            <div class="day-transactions-section">
                <div class="day-transactions-section-header expense-header">
                    <span class="day-transactions-section-title">Dépenses</span>
                    <span class="day-transactions-section-total expense">${formatCurrency(dayExpense)}</span>
                </div>
                <div class="day-transactions-list expense-list">
                    ${expenseTransactions.map(transaction => {
        const category = data.categories.find(cat => cat.id === transaction.categoryId);
        const categoryColor = category ? category.color : '#64748b';
        const categoryName = category ? category.name : 'Catégorie supprimée';
                        const isRecurring = transaction.recurrence || transaction.originalId;
        
        return `
                            <div class="day-transaction-item expense-item">
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
                                <div class="day-transaction-amount expense">
                                    ${formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    detailsCard.style.display = 'block';
}

/**
 * Affiche les détails d'une semaine
 */
export function showWeekDetails(startDate, filters = { type: 'all', categoryId: null, showRecurring: true }) {
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
    
    const allTransactions = getAllTransactions();
    
    // Appliquer les filtres
    const weekTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        if (tDate < weekStart || tDate > weekEnd) return false;
        
        // Filtre par type
        if (filters.type === 'income' && t.amount <= 0) return false;
        if (filters.type === 'expense' && t.amount > 0) return false;
        
        // Filtre par catégorie
        if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
        
        // Filtre récurrence (non appliqué dans les détails, on affiche tout)
        
        return true;
    });
    
    const data = loadData();
    
    // Grouper par catégorie
    const transactionsByCategory = {};
    
    weekTransactions.forEach(t => {
        const categoryId = t.categoryId || 'uncategorized';
        if (!transactionsByCategory[categoryId]) {
            transactionsByCategory[categoryId] = {
                categoryId,
                transactions: [],
                totalIncome: 0,
                totalExpense: 0
            };
        }
        transactionsByCategory[categoryId].transactions.push(t);
        if (t.amount > 0) {
            transactionsByCategory[categoryId].totalIncome += t.amount;
        } else {
            transactionsByCategory[categoryId].totalExpense += Math.abs(t.amount);
        }
    });
    
    // Calculer les totaux de la semaine
    let weekIncome = 0;
    let weekExpense = 0;
    weekTransactions.forEach(t => {
        if (t.amount > 0) {
            weekIncome += t.amount;
        } else {
            weekExpense += Math.abs(t.amount);
        }
    });
    const weekBalance = weekIncome - weekExpense;
    
    // Séparer les catégories en revenus et dépenses
    const incomeCategories = [];
    const expenseCategories = [];
    
    Object.values(transactionsByCategory).forEach(catData => {
        const category = data.categories.find(c => c.id === catData.categoryId);
        const categoryName = category ? category.name : 'Catégorie supprimée';
        const categoryColor = category ? category.color : '#64748b';
        const balance = catData.totalIncome - catData.totalExpense;
        
        if (catData.totalIncome > 0) {
            incomeCategories.push({
                ...catData,
                categoryName,
                categoryColor,
                balance: catData.totalIncome
            });
        }
        if (catData.totalExpense > 0) {
            expenseCategories.push({
                ...catData,
                categoryName,
                categoryColor,
                balance: -catData.totalExpense
            });
        }
    });
    
    // Trier par montant décroissant
    incomeCategories.sort((a, b) => b.balance - a.balance);
    expenseCategories.sort((a, b) => a.balance - b.balance);
    
    detailsTitle.textContent = `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    
    transactionsList.innerHTML = `
        <div class="week-details-summary">
            <div class="week-details-item">
                <span>Revenus:</span>
                <span class="income">${formatCurrency(weekIncome)}</span>
            </div>
            <div class="week-details-item">
                <span>Dépenses:</span>
                <span class="expense">${formatCurrency(weekExpense)}</span>
            </div>
            <div class="week-details-item highlight">
                <span>Solde:</span>
                <span class="${weekBalance >= 0 ? 'income' : 'expense'}">${formatCurrency(weekBalance)}</span>
            </div>
        </div>
        <div class="week-details-categories">
            ${incomeCategories.length > 0 ? `
                <div class="week-details-category-section income-section">
                    <div class="week-details-category-section-header income-header">
                        <span>Revenus par catégorie</span>
                        <span class="week-details-category-section-total income">${formatCurrency(weekIncome)}</span>
                    </div>
                    <div class="week-details-category-list income-categories">
                        ${incomeCategories.map(catData => {
                            const isRecurring = catData.transactions.some(t => t.recurrence || t.originalId);
                            return `
                                <div class="week-details-category-item income-category">
                                    <div class="week-details-category-info">
                                        <div class="week-details-category-color" style="background-color: ${catData.categoryColor}"></div>
                                        <div class="week-details-category-details">
                                            <span class="week-details-category-name">${escapeHtml(catData.categoryName)}</span>
                                            ${isRecurring ? '<span class="recurring-badge" title="Contient des transactions récurrentes">🔄</span>' : ''}
                                            <span class="week-details-category-count">${catData.transactions.length} transaction${catData.transactions.length > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <span class="week-details-category-amount income">
                                        +${formatCurrency(catData.balance)}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            ${expenseCategories.length > 0 ? `
                <div class="week-details-category-section expense-section">
                    <div class="week-details-category-section-header expense-header">
                        <span>Dépenses par catégorie</span>
                        <span class="week-details-category-section-total expense">${formatCurrency(weekExpense)}</span>
                    </div>
                    <div class="week-details-category-list expense-categories">
                        ${expenseCategories.map(catData => {
                            const isRecurring = catData.transactions.some(t => t.recurrence || t.originalId);
                            return `
                                <div class="week-details-category-item expense-category">
                                    <div class="week-details-category-info">
                                        <div class="week-details-category-color" style="background-color: ${catData.categoryColor}"></div>
                                        <div class="week-details-category-details">
                                            <span class="week-details-category-name">${escapeHtml(catData.categoryName)}</span>
                                            ${isRecurring ? '<span class="recurring-badge" title="Contient des transactions récurrentes">🔄</span>' : ''}
                                            <span class="week-details-category-count">${catData.transactions.length} transaction${catData.transactions.length > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <span class="week-details-category-amount expense">
                                        ${formatCurrency(catData.balance)}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            ${weekTransactions.length === 0 ? '<div class="week-details-no-transactions">Aucune transaction</div>' : ''}
        </div>
    `;
    
    detailsCard.style.display = 'block';
}

/**
 * Affiche la légende interactive
 */
export function renderLegend(filters) {
    const legendContainer = document.getElementById('calendar-legend');
    if (!legendContainer) {
        return;
    }
    
    // #region agent log
    const pageContent = legendContainer.closest('.page-content');
    const computedStyle = window.getComputedStyle(legendContainer);
    const pageContentStyle = pageContent ? window.getComputedStyle(pageContent) : null;
    // #endregion
    
    legendContainer.innerHTML = `
        <div class="calendar-legend-items">
            <div class="calendar-legend-item ${filters.type === 'all' ? 'active' : ''}" data-filter-type="all">
                <span>Tous</span>
            </div>
            <div class="calendar-legend-item ${filters.type === 'income' ? 'active' : ''}" data-filter-type="income">
                <div class="calendar-legend-indicator income"></div>
                <span>Revenus</span>
            </div>
            <div class="calendar-legend-item ${filters.type === 'expense' ? 'active' : ''}" data-filter-type="expense">
                <div class="calendar-legend-indicator expense"></div>
                <span>Dépenses</span>
            </div>
            <div class="calendar-legend-item calendar-legend-recurring ${filters.showRecurring ? 'active' : ''}" data-filter-type="recurring">
                <div class="calendar-recurring-toggle">
                    <div class="calendar-recurring-toggle-slider"></div>
                </div>
                <span>Récurrentes</span>
            </div>
            <div class="calendar-legend-category">
                <select id="calendar-category-filter">
                    <option value="">Toutes les catégories</option>
                </select>
            </div>
        </div>
    `;
    
    // Remplir le select de catégorie avec la valeur du filtre actuel
    populateCategorySelect('calendar-category-filter', null, filters.categoryId || null);
    
    // Vérifier que la valeur est correctement définie
    const categorySelect = document.getElementById('calendar-category-filter');
    if (categorySelect) {
        // S'assurer que le texte affiché est correct
        if (categorySelect.value === '' && categorySelect.options.length > 0) {
            categorySelect.selectedIndex = 0; // Sélectionner "Toutes les catégories"
        }
    }
    
    // #region agent log
    setTimeout(() => {
        const computedStyleAfter = window.getComputedStyle(legendContainer);
        const legendItems = legendContainer.querySelector('.calendar-legend-items');
        const legendItemsStyle = legendItems ? window.getComputedStyle(legendItems) : null;
        const pageContent = legendContainer.closest('.page-content');
        const pageContentStyle = pageContent ? window.getComputedStyle(pageContent) : null;
        const mainContent = legendContainer.closest('.main-content');
        const mainContentStyle = mainContent ? window.getComputedStyle(mainContent) : null;
    }, 500);
    // #endregion
}
