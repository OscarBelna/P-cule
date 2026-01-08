import { adjustSummaryCardsSizes } from './DashboardRenderer.js';

// Variable globale pour stocker le mois sélectionné
let selectedMonth = null;
let selectedYear = null;
let currentDisplayYear = null;
let monthSelectorDropdown = null;
let monthSelectorButton = null;

/**
 * Initialise le tableau de bord
 */
export function initDashboard() {
    // Initialiser le sélecteur de mois avec le mois en cours
    const today = new Date();
    selectedMonth = today.getMonth();
    selectedYear = today.getFullYear();
    currentDisplayYear = today.getFullYear();
    
    // Initialiser le menu personnalisé
    initCustomMonthSelector();
    
    // Fermer le menu si on clique en dehors
    document.addEventListener('click', (e) => {
        if (monthSelectorDropdown && monthSelectorButton && 
            !monthSelectorDropdown.contains(e.target) && !monthSelectorButton.contains(e.target)) {
            closeMonthSelector();
        }
    });
    
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
 * Initialise le menu de sélection de mois personnalisé
 */
function initCustomMonthSelector() {
    monthSelectorButton = document.getElementById('dashboard-month-select');
    monthSelectorDropdown = document.getElementById('month-selector-dropdown');
    const yearDisplay = document.getElementById('month-selector-year');
    const prevYearBtn = document.getElementById('month-prev-year');
    const nextYearBtn = document.getElementById('month-next-year');
    const grid = document.getElementById('month-selector-grid');
    
    if (!monthSelectorButton || !monthSelectorDropdown || !grid) return;
    
    // Mettre à jour l'affichage initial
    updateMonthSelectorDisplay();
    renderMonthGrid();
    
    // Ouvrir/fermer le menu
    monthSelectorButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMonthSelector();
    });
    
    // Navigation des années
    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDisplayYear--;
            updateYearDisplay();
            renderMonthGrid();
        });
    }
    
    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDisplayYear++;
            updateYearDisplay();
            renderMonthGrid();
        });
    }
    
    // Mettre à jour l'année affichée
    function updateYearDisplay() {
        if (yearDisplay) {
            yearDisplay.textContent = currentDisplayYear;
        }
    }
    
    // Rendre la grille des mois
    function renderMonthGrid() {
        if (!grid) return;
        
        const monthNames = [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        
        grid.innerHTML = '';
        
        monthNames.forEach((monthName, index) => {
            const item = document.createElement('button');
            item.className = 'month-selector-item';
            item.type = 'button';
            item.textContent = monthName;
            
            // Marquer le mois sélectionné
            if (index === selectedMonth && currentDisplayYear === selectedYear) {
                item.classList.add('selected');
            }
            
            // Gérer la sélection
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                selectMonth(index, currentDisplayYear);
            });
            
            grid.appendChild(item);
        });
        
        updateYearDisplay();
    }
    
    // Sélectionner un mois
    function selectMonth(month, year) {
        selectedMonth = month;
        selectedYear = year;
        currentDisplayYear = year;
        
        updateMonthSelectorDisplay();
        closeMonthSelector();
        renderMonthGrid();
        
        // Utiliser window.renderDashboard pour éviter la dépendance circulaire
        if (window.renderDashboard) {
            window.renderDashboard();
        }
    }
    
    // Mettre à jour l'affichage du bouton
    function updateMonthSelectorDisplay() {
        const textEl = document.getElementById('month-selector-text');
        if (textEl) {
            const monthNames = [
                'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
            ];
            textEl.textContent = `${monthNames[selectedMonth]} ${selectedYear}`;
        }
    }
    
    // Ouvrir/fermer le menu
    function toggleMonthSelector() {
        if (monthSelectorDropdown.classList.contains('show')) {
            closeMonthSelector();
        } else {
            openMonthSelector();
        }
    }
    
    function openMonthSelector() {
        currentDisplayYear = selectedYear;
        renderMonthGrid();
        monthSelectorButton.classList.add('active');
        monthSelectorDropdown.classList.add('show');
    }
}

/**
 * Ferme le sélecteur de mois
 */
function closeMonthSelector() {
    if (monthSelectorButton) {
        monthSelectorButton.classList.remove('active');
    }
    if (monthSelectorDropdown) {
        monthSelectorDropdown.classList.remove('show');
    }
}

/**
 * Retourne le mois et l'année sélectionnés
 */
export function getSelectedMonth() {
    return { month: selectedMonth, year: selectedYear };
}

