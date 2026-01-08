import { renderTransactions } from './TransactionRenderer.js';
import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';

// État des filtres
let selectedFilterMonth = null;
let selectedFilterYear = null;
let selectedCategoryId = '';
let selectedRecurrenceFilter = '';
let currentDisplayYear = null;

// Références aux éléments DOM
let monthFilterGrid = null;
let categoryFilterSelect = null;
let renderMonthGridFunction = null; // Référence à la fonction renderMonthGrid
let updateMonthFilterDisplayFunction = null; // Référence à la fonction updateMonthFilterDisplay

/**
 * Initialise les filtres de l'historique des transactions
 */
export function initTransactionFilters() {
    const today = new Date();
    currentDisplayYear = today.getFullYear();
    
    // Initialiser le sélecteur de mois
    initMonthFilter();
    
    // Initialiser le filtre catégorie
    initCategoryFilter();
    
    // Initialiser le filtre récurrence
    initRecurrenceFilter();
}

/**
 * Obtient toutes les transactions originales (sans les récurrentes générées)
 */
function getOriginalTransactions() {
    const allTransactions = getAllTransactions();
    return allTransactions.filter(transaction => {
        return !transaction.isRecurring && !transaction.originalId;
    });
}

/**
 * Détermine quels mois ont des transactions pour une catégorie donnée
 * @param {string} categoryId - ID de la catégorie ('' pour toutes)
 * @returns {Set<string>} Set de clés "month-year" (ex: "0-2024")
 */
function getAvailableMonths(categoryId = '') {
    const transactions = getOriginalTransactions();
    const availableMonths = new Set();
    
    transactions.forEach(transaction => {
        if (categoryId && transaction.categoryId !== categoryId) {
            return;
        }
        
        const date = new Date(transaction.date);
        const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
        availableMonths.add(monthKey);
    });
    
    return availableMonths;
}

/**
 * Détermine quelles catégories ont des transactions pour un mois donné
 * @param {number|null} month - Mois (0-11, null pour tous)
 * @param {number|null} year - Année (null pour tous)
 * @returns {Set<string>} Set d'IDs de catégories
 */
function getAvailableCategories(month = null, year = null) {
    const transactions = getOriginalTransactions();
    const availableCategories = new Set();
    
    transactions.forEach(transaction => {
        if (month !== null && year !== null) {
            const date = new Date(transaction.date);
            if (date.getMonth() !== month || date.getFullYear() !== year) {
                return;
            }
        }
        
        if (transaction.categoryId) {
            availableCategories.add(transaction.categoryId);
        }
    });
    
    return availableCategories;
}

/**
 * Initialise le filtre de mois
 */
function initMonthFilter() {
    const button = document.getElementById('transactions-month-select');
    const dropdown = document.getElementById('transactions-month-selector-dropdown');
    const yearDisplay = document.getElementById('transactions-month-selector-year');
    const prevYearBtn = document.getElementById('transactions-month-prev-year');
    const nextYearBtn = document.getElementById('transactions-month-next-year');
    const grid = document.getElementById('transactions-month-selector-grid');
    const clearBtn = document.getElementById('transactions-month-clear');
    const textDisplay = document.getElementById('transactions-month-selector-text');
    
    if (!button || !dropdown || !grid) return;
    
    // Mettre à jour l'affichage initial
    updateMonthFilterDisplay();
    renderMonthGrid();
    
    // Ouvrir/fermer le menu
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMonthFilter();
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
    
    // Bouton pour effacer le filtre mois
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedFilterMonth = null;
            selectedFilterYear = null;
            updateMonthFilterDisplay();
            updateCategoryFilter(); // Mettre à jour les catégories disponibles
            applyFilters();
            toggleMonthFilter();
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
        grid.innerHTML = '';
        monthFilterGrid = grid; // Sauvegarder la référence
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        // Obtenir les mois disponibles si une catégorie est sélectionnée
        const availableMonths = selectedCategoryId ? getAvailableMonths(selectedCategoryId) : null;
        
        monthNames.forEach((monthName, index) => {
            const monthItem = document.createElement('button');
            monthItem.type = 'button';
            monthItem.className = 'month-selector-month-item';
            monthItem.textContent = monthName;
            
            // Vérifier si le mois est disponible
            if (availableMonths) {
                const monthKey = `${index}-${currentDisplayYear}`;
                if (!availableMonths.has(monthKey)) {
                    monthItem.classList.add('disabled');
                    monthItem.disabled = true;
                }
            }
            
            // Marquer comme sélectionné si c'est le mois filtré
            if (selectedFilterMonth === index && selectedFilterYear === currentDisplayYear) {
                monthItem.classList.add('selected');
            }
            
            monthItem.addEventListener('click', (e) => {
                e.stopPropagation();
                if (monthItem.disabled) return;
                
                selectedFilterMonth = index;
                selectedFilterYear = currentDisplayYear;
                updateMonthFilterDisplay();
                updateCategoryFilter(); // Mettre à jour les catégories disponibles
                applyFilters();
                toggleMonthFilter();
            });
            
            grid.appendChild(monthItem);
        });
    }
    
    // Sauvegarder la référence à la fonction pour pouvoir l'appeler depuis l'extérieur
    renderMonthGridFunction = renderMonthGrid;
    
    // Mettre à jour l'affichage du bouton
    function updateMonthFilterDisplay() {
        if (textDisplay) {
            if (selectedFilterMonth !== null && selectedFilterYear !== null) {
                const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                textDisplay.textContent = `${monthNames[selectedFilterMonth]} ${selectedFilterYear}`;
            } else {
                textDisplay.textContent = 'Tous les mois';
            }
        }
        if (yearDisplay) {
            yearDisplay.textContent = selectedFilterYear !== null ? selectedFilterYear : currentDisplayYear;
        }
    }
    
    // Sauvegarder la référence à la fonction pour pouvoir l'appeler depuis l'extérieur
    updateMonthFilterDisplayFunction = updateMonthFilterDisplay;
    
    // Ouvrir/fermer le menu
    function toggleMonthFilter() {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            button.classList.remove('active');
            document.removeEventListener('click', closeMonthFilterOutside);
        } else {
            // Réinitialiser l'année affichée au mois sélectionné ou à l'année actuelle
            if (selectedFilterYear !== null) {
                currentDisplayYear = selectedFilterYear;
            } else {
                const today = new Date();
                currentDisplayYear = today.getFullYear();
            }
            updateYearDisplay();
            renderMonthGrid();
            
            dropdown.classList.add('show');
            button.classList.add('active');
            document.addEventListener('click', closeMonthFilterOutside);
        }
    }
    
    function closeMonthFilterOutside(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            toggleMonthFilter();
        }
    }
}

/**
 * Initialise le filtre catégorie
 */
function initCategoryFilter() {
    const categoryFilter = document.getElementById('transactions-category-filter');
    if (!categoryFilter) return;
    
    categoryFilterSelect = categoryFilter; // Sauvegarder la référence
    
    // Remplir le select avec les catégories
    updateCategoryFilter();
    
    // Écouter les changements
    categoryFilter.addEventListener('change', () => {
        selectedCategoryId = categoryFilter.value;
        // Mettre à jour la grille des mois si la fonction est disponible
        if (renderMonthGridFunction) {
            renderMonthGridFunction();
        }
        // Si un mois est sélectionné, vérifier s'il est toujours valide avec la nouvelle catégorie
        if (selectedFilterMonth !== null && selectedFilterYear !== null) {
            const availableMonths = selectedCategoryId ? getAvailableMonths(selectedCategoryId) : null;
            if (availableMonths) {
                const monthKey = `${selectedFilterMonth}-${selectedFilterYear}`;
                if (!availableMonths.has(monthKey)) {
                    // Le mois sélectionné n'a pas de transactions pour cette catégorie, réinitialiser
                    selectedFilterMonth = null;
                    selectedFilterYear = null;
                    if (updateMonthFilterDisplayFunction) {
                        updateMonthFilterDisplayFunction();
                    }
                    updateCategoryFilter();
                }
            }
        }
        applyFilters();
    });
}

/**
 * Met à jour le filtre catégorie selon le mois sélectionné
 */
function updateCategoryFilter() {
    if (!categoryFilterSelect) return;
    
    const data = loadData();
    const currentValue = categoryFilterSelect.value;
    
    // Obtenir les catégories disponibles
    // Si un mois est sélectionné, utiliser getAvailableCategories avec ce mois
    // Sinon, utiliser getAvailableCategories sans paramètres pour obtenir toutes les catégories avec données
    const availableCategories = selectedFilterMonth !== null && selectedFilterYear !== null
        ? getAvailableCategories(selectedFilterMonth, selectedFilterYear)
        : getAvailableCategories(); // Sans paramètres = toutes les catégories ayant des transactions
    
    // Vider le select
    categoryFilterSelect.innerHTML = '';
    
    // Ajouter l'option "Toutes les catégories"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Toutes les catégories';
    categoryFilterSelect.appendChild(allOption);
    
    // Ajouter uniquement les catégories qui ont des transactions
    data.categories.forEach(category => {
        // N'afficher que les catégories disponibles (qui ont des transactions)
        if (!availableCategories.has(category.id)) {
            return;
        }
        
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilterSelect.appendChild(option);
    });
    
    // Restaurer la valeur sélectionnée si elle est toujours disponible
    if (currentValue && availableCategories.has(currentValue)) {
        categoryFilterSelect.value = currentValue;
    } else {
        categoryFilterSelect.value = '';
        selectedCategoryId = '';
    }
}

/**
 * Initialise le filtre récurrence
 */
function initRecurrenceFilter() {
    const recurrenceFilter = document.getElementById('transactions-recurrence-filter');
    if (!recurrenceFilter) return;
    
    // Écouter les changements
    recurrenceFilter.addEventListener('change', () => {
        selectedRecurrenceFilter = recurrenceFilter.value;
        applyFilters();
    });
}

/**
 * Applique les filtres et met à jour l'affichage
 */
function applyFilters() {
    renderTransactions(selectedFilterMonth, selectedFilterYear, selectedCategoryId, selectedRecurrenceFilter);
}

/**
 * Obtient les filtres actuels
 */
export function getTransactionFilters() {
    return {
        month: selectedFilterMonth,
        year: selectedFilterYear,
        categoryId: selectedCategoryId,
        recurrence: selectedRecurrenceFilter
    };
}

