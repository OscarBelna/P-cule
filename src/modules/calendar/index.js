// Interface publique du module Calendar
import { initCalendar, getCurrentCalendarDate, resetCalendarDate } from './CalendarController.js';
import { renderCalendar as renderCalendarInternal } from './CalendarRenderer.js';

// Exporter renderCalendar avec la date actuelle par défaut
export function renderCalendar() {
    renderCalendarInternal(getCurrentCalendarDate());
}

export { initCalendar };

