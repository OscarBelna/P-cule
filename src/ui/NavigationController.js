/**
 * Initialise la navigation entre les pages
 */
export function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');

            // Mettre à jour les onglets actifs
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Afficher la page correspondante
            pages.forEach(page => page.classList.remove('active'));
            const targetPageElement = document.getElementById(targetPage);
            if (targetPageElement) {
                targetPageElement.classList.add('active');
            }

            // Recharger les données selon la page via les callbacks globaux
            if (targetPage === 'settings') {
                if (window.renderCategories) window.renderCategories();
            } else if (targetPage === 'transactions') {
                if (window.renderTransactions) window.renderTransactions();
                if (window.populateCategorySelect) window.populateCategorySelect();
            } else if (targetPage === 'calendar') {
                if (window.renderCalendar) window.renderCalendar();
            } else if (targetPage === 'dashboard') {
                if (window.renderDashboard) window.renderDashboard();
            } else if (targetPage === 'goals') {
                if (window.renderGoals) window.renderGoals();
            }
        });
    });
}

