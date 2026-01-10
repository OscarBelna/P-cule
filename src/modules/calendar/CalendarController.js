import { renderCalendar as renderCalendarInternal, renderWeekView, renderYearView, renderMonthSummary, renderLegend } from './CalendarRenderer.js';
import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';

// État du calendrier
let currentCalendarDate = new Date();
let currentViewType = 'month'; // 'month' | 'week' | 'year'
let currentFilters = {
    type: 'all', // 'all' | 'income' | 'expense'
    categoryId: null,
    showRecurring: true
};

/**
 * Initialise le calendrier
 */
export function initCalendar() {
    // Navigation mois précédent/suivant
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigatePrevious();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateNext();
        });
    }
    
    // Bouton "Aujourd'hui"
    const todayBtn = document.getElementById('calendar-today');
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            goToToday();
        });
    }
    
    // Sélecteur de vue
    const viewButtons = document.querySelectorAll('.calendar-view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.getAttribute('data-view');
            if (viewType) {
                setViewType(viewType);
            }
        });
    });
    
    // Les filtres (Type, Récurrentes, Catégorie) sont maintenant gérés par la légende interactive
    // Les event listeners seront attachés par connectLegendListeners() après le rendu initial
    
    // Légende interactive
    const legendItems = document.querySelectorAll('.calendar-legend-item');
    legendItems.forEach(item => {
        item.addEventListener('click', () => {
            const filterType = item.getAttribute('data-filter-type');
            if (filterType) {
                if (filterType === 'all') {
                    setFilterType('all');
                } else if (filterType === 'income' || filterType === 'expense') {
                    setFilterType(filterType === currentFilters.type ? 'all' : filterType);
                } else if (filterType === 'recurring') {
                    setShowRecurring(!currentFilters.showRecurring);
                }
            }
        });
    });
    
    // Rendu initial
    renderCurrentView();
}

/**
 * Navigue vers le mois/semaine/année précédent
 */
function navigatePrevious() {
    if (currentViewType === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    } else if (currentViewType === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    } else if (currentViewType === 'year') {
        currentCalendarDate.setFullYear(currentCalendarDate.getFullYear() - 1);
    }
    renderCurrentView();
}

/**
 * Navigue vers le mois/semaine/année suivant
 */
function navigateNext() {
    if (currentViewType === 'month') {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    } else if (currentViewType === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    } else if (currentViewType === 'year') {
        currentCalendarDate.setFullYear(currentCalendarDate.getFullYear() + 1);
    }
    renderCurrentView();
}

/**
 * Change le type de vue
 */
export function setViewType(type) {
    if (['month', 'week', 'year'].includes(type)) {
        currentViewType = type;
        updateViewButtons();
        renderCurrentView();
    }
}

/**
 * Met à jour l'état visuel des boutons de vue
 */
function updateViewButtons() {
    const viewButtons = document.querySelectorAll('.calendar-view-btn');
    viewButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === currentViewType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Met à jour les filtres
 */
export function setFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    renderCurrentView();
}

/**
 * Change le type de filtre (all/income/expense)
 */
function setFilterType(type) {
    currentFilters.type = type;
    updateFilterButtons();
    renderCurrentView();
}

/**
 * Change la catégorie filtrée
 */
function setFilterCategory(categoryId) {
    currentFilters.categoryId = categoryId;
    renderCurrentView();
}

/**
 * Change l'affichage des transactions récurrentes
 */
function setShowRecurring(show) {
    currentFilters.showRecurring = show;
    renderCurrentView();
}

/**
 * Met à jour l'état visuel des boutons de filtre
 * (Les filtres sont maintenant gérés par la légende interactive)
 */
function updateFilterButtons() {
    // Les boutons de filtre sont maintenant dans la légende, gérés par renderLegend
}

/**
 * Retourne à aujourd'hui
 */
export function goToToday() {
    currentCalendarDate = new Date();
    renderCurrentView();
}

/**
 * Navigue vers une date spécifique
 */
export function goToDate(date) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
        currentCalendarDate = dateObj;
        renderCurrentView();
    }
}

/**
 * Gère la recherche de date
 */
function handleDateSearch(dateString) {
    goToDate(dateString);
    // Si on est en vue année, basculer en vue mois
    if (currentViewType === 'year') {
        setViewType('month');
    }
}

/**
 * Rend la vue actuelle
 */
function renderCurrentView() {
    // Ajouter classe de transition
    const calendarContainer = document.getElementById('calendar-grid');
    if (calendarContainer) {
        calendarContainer.classList.add('calendar-transition');
        setTimeout(() => {
            calendarContainer.classList.remove('calendar-transition');
        }, 300);
    }
    
    if (currentViewType === 'month') {
        renderCalendarInternal(currentCalendarDate, currentFilters);
        renderMonthSummary(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    } else if (currentViewType === 'week') {
        renderWeekView(currentCalendarDate, currentFilters);
    } else if (currentViewType === 'year') {
        renderYearView(currentCalendarDate.getFullYear(), currentFilters);
    }
    
    // Mettre à jour la légende
    renderLegend(currentFilters);
    
    // Reconnecter les event listeners de la légende après le rendu
    try {
        connectLegendListeners();
    } catch (error) {
        console.error('Erreur dans connectLegendListeners:', error);
    }
}

/**
 * Connecte les event listeners de la légende interactive
 * Cette fonction doit être appelée après chaque rendu de la légende
 */
function connectLegendListeners() {
    const legendItems = document.querySelectorAll('.calendar-legend-item');
    
    legendItems.forEach(item => {
        item.addEventListener('click', () => {
            const filterType = item.getAttribute('data-filter-type');
            
            if (filterType) {
                if (filterType === 'all') {
                    setFilterType('all');
                } else if (filterType === 'income' || filterType === 'expense') {
                    setFilterType(filterType === currentFilters.type ? 'all' : filterType);
                } else if (filterType === 'recurring') {
                    setShowRecurring(!currentFilters.showRecurring);
                }
            }
        });
    });
    
    // Attacher l'event listener pour le filtre de catégorie
    const categoryFilter = document.getElementById('calendar-category-filter');
    if (categoryFilter) {
        // Sauvegarder la valeur sélectionnée avant le clonage
        const savedValue = categoryFilter.value;
        
        // Supprimer les anciens listeners pour éviter les doublons
        const newCategoryFilter = categoryFilter.cloneNode(true);
        
        // Restaurer la valeur sélectionnée après le clonage
        newCategoryFilter.value = savedValue;
        
        categoryFilter.parentNode.replaceChild(newCategoryFilter, categoryFilter);
        
        newCategoryFilter.addEventListener('change', (e) => {
            setFilterCategory(e.target.value || null);
        });
    }
}

/**
 * Obtient la date actuelle du calendrier
 */
export function getCurrentCalendarDate() {
    return new Date(currentCalendarDate);
}

/**
 * Obtient le type de vue actuel
 */
export function getCurrentViewType() {
    return currentViewType;
}

/**
 * Obtient les filtres actuels
 */
export function getCurrentFilters() {
    return { ...currentFilters };
}

/**
 * Réinitialise la date du calendrier à aujourd'hui
 */
export function resetCalendarDate() {
    currentCalendarDate = new Date();
}

/**
 * Calcule le résumé mensuel
 */
export function getMonthSummary(year, month) {
    const transactions = getAllTransactions();
    const data = loadData();
    
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
export function getWeekSummary(startDate) {
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
