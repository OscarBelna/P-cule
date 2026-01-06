import { renderCalendar as renderCalendarInternal } from './CalendarRenderer.js';

// Variable d'état pour la date du calendrier
let currentCalendarDate = new Date();

/**
 * Initialise le calendrier
 */
export function initCalendar() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendarInternal(currentCalendarDate);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendarInternal(currentCalendarDate);
        });
    }
}

/**
 * Obtient la date actuelle du calendrier
 */
export function getCurrentCalendarDate() {
    return currentCalendarDate;
}

/**
 * Réinitialise la date du calendrier à aujourd'hui
 */
export function resetCalendarDate() {
    currentCalendarDate = new Date();
}

