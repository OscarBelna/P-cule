import { renderDashboard, adjustSummaryCardsSizes } from './DashboardRenderer.js';

/**
 * Initialise le tableau de bord
 */
export function initDashboard() {
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

