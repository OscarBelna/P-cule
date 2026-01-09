// Interface publique du module Calendar
import { initCalendar, getCurrentCalendarDate, getCurrentFilters, resetCalendarDate } from './CalendarController.js';
import { renderCalendar as renderCalendarInternal } from './CalendarRenderer.js';

// Exporter renderCalendar avec la date actuelle par défaut
export function renderCalendar() {
    renderCalendarInternal(getCurrentCalendarDate(), getCurrentFilters());
}

export { initCalendar };

