import { adjustSummaryCardsSizes } from './DashboardRenderer.js';

// Variable globale pour stocker le mois sélectionné
let selectedMonth = null;
let selectedYear = null;

/**
 * Initialise le tableau de bord
 */
export function initDashboard() {
    // Initialiser le sélecteur de mois avec le mois en cours
    const monthSelect = document.getElementById('dashboard-month-select');
    if (monthSelect) {
        const today = new Date();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentYear = today.getFullYear();
        monthSelect.value = `${currentYear}-${currentMonth}`;
        selectedMonth = today.getMonth();
        selectedYear = currentYear;
        
        // Écouter les changements de mois
        monthSelect.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-');
            selectedYear = parseInt(year);
            selectedMonth = parseInt(month) - 1; // Les mois sont 0-indexés en JS
            // Utiliser window.renderDashboard pour éviter la dépendance circulaire
            if (window.renderDashboard) {
                window.renderDashboard();
            }
        });
    }
    
    // Écouter les redimensionnements de la fenêtre
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Réajuster les cartes après redimensionnement
            const summaryCards = document.querySelectorAll('.summary-card');
            if (summaryCards.length > 0) {
                // Réinitialiser les tailles puis réajuster
                summaryCards.forEach(card => {
                    const iconEl = card.querySelector('.summary-card-icon');
                    const valueEl = card.querySelector('.summary-card-value');
                    if (iconEl) iconEl.style.fontSize = '';
                    if (valueEl) valueEl.style.fontSize = '';
                });
                
                // Réajuster après un court délai pour laisser le temps au layout de se stabiliser
                setTimeout(() => {
                    adjustSummaryCardsSizes();
                }, 100);
            }
        }, 250);
    });
}

/**
 * Retourne le mois et l'année sélectionnés
 */
export function getSelectedMonth() {
    return { month: selectedMonth, year: selectedYear };
}

