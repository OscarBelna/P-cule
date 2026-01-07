import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';

/**
 * Affiche le calendrier
 * @param {Date} currentDate - La date actuelle du calendrier
 */
export function renderCalendar(currentDate = new Date()) {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!grid || !monthYear) return;
    
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
    
    // Obtenir toutes les transactions
    const transactions = getAllTransactions();
    
    // Grouper les transactions par date
    const transactionsByDate = {};
    transactions.forEach(transaction => {
        if (!transactionsByDate[transaction.date]) {
            transactionsByDate[transaction.date] = { income: false, expense: false };
        }
        if (transaction.amount > 0) {
            transactionsByDate[transaction.date].income = true;
        } else {
            transactionsByDate[transaction.date].expense = true;
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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    // Sélectionner le jour en cours seulement si on est dans le mois actuel
    const selectedDate = isCurrentMonth ? todayStr : null;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTransactions = transactionsByDate[dateStr];
        const isToday = isCurrentMonth && day === today.getDate();
        const isSelected = selectedDate !== null && dateStr === selectedDate;
        
        let indicators = '';
        if (dayTransactions) {
            if (dayTransactions.income) {
                indicators += '<div class="calendar-indicator income"></div>';
            }
            if (dayTransactions.expense) {
                indicators += '<div class="calendar-indicator expense"></div>';
            }
        }
        
        grid.innerHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
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
 * Affiche les détails d'un jour
 * @param {string} dateStr - La date au format YYYY-MM-DD
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
    
    // Trier par montant (dépenses d'abord, puis revenus)
    dayTransactions.sort((a, b) => a.amount - b.amount);
    
    transactionsList.innerHTML = dayTransactions.map(transaction => {
        const category = data.categories.find(cat => cat.id === transaction.categoryId);
        const categoryColor = category ? category.color : '#64748b';
        const categoryName = category ? category.name : 'Catégorie supprimée';
        const isIncome = transaction.amount > 0;
        
        return `
            <div class="day-transaction-item">
                <div class="day-transaction-info">
                    <div class="day-transaction-color" style="background-color: ${categoryColor}"></div>
                    <div class="day-transaction-details">
                        <div class="day-transaction-category">${escapeHtml(categoryName)}</div>
                        ${transaction.description ? `<div class="day-transaction-description">${escapeHtml(transaction.description)}</div>` : ''}
                    </div>
                </div>
                <div class="day-transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : ''}${transaction.amount.toFixed(2)} €
                </div>
            </div>
        `;
    }).join('');
    
    detailsCard.style.display = 'block';
    // Ne pas faire de scroll automatique pour éviter de déplacer la page
}

