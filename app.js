// Structure de données par défaut
const defaultData = {
    categories: [],
    transactions: [],
    goals: {
        incomeGoal: null,
        categoryBudgets: []
    }
};

// Clé pour le LocalStorage
const STORAGE_KEY = 'pecule_data';

// ============================================
// GESTION DU LOCALSTORAGE
// ============================================

/**
 * Sauvegarde les données dans le LocalStorage
 * @param {Object} data - Les données à sauvegarder
 */
function saveData(data) {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, jsonData);
        console.log('Données sauvegardées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Charge les données depuis le LocalStorage
 * @returns {Object} Les données chargées ou les données par défaut
 */
function loadData() {
    try {
        const jsonData = localStorage.getItem(STORAGE_KEY);
        if (jsonData) {
            const data = JSON.parse(jsonData);
            // S'assurer que toutes les propriétés existent
            return {
                categories: data.categories || [],
                transactions: data.transactions || [],
                goals: data.goals || {
                    incomeGoal: null,
                    categoryBudgets: []
                }
            };
        }
        return defaultData;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return defaultData;
    }
}

// ============================================
// GESTION DE LA NAVIGATION
// ============================================

function initNavigation() {
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
            document.getElementById(targetPage).classList.add('active');

            // Recharger les données selon la page
            if (targetPage === 'settings') {
                renderCategories();
            } else if (targetPage === 'transactions') {
                renderTransactions();
                populateCategorySelect();
            } else if (targetPage === 'calendar') {
                renderCalendar();
            } else if (targetPage === 'dashboard') {
                renderDashboard();
            } else if (targetPage === 'goals') {
                renderGoals();
            }
        });
    });
}

// ============================================
// GESTION DES CATÉGORIES
// ============================================

let editingCategoryId = null;
let categoryModalCallback = null; // Callback pour après création de catégorie

/**
 * Initialise le formulaire de catégorie
 */
function initCategoryForm() {
    const form = document.getElementById('category-form');
    const cancelBtn = document.getElementById('category-cancel');
    const colorInput = document.getElementById('category-color');
    const colorPreview = document.getElementById('color-preview');

    // Mise à jour de l'aperçu de couleur
    colorInput.addEventListener('input', (e) => {
        colorPreview.style.backgroundColor = e.target.value;
    });

    // Initialiser l'aperçu de couleur
    colorPreview.style.backgroundColor = colorInput.value;

    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCategorySubmit();
    });

    // Annulation
    cancelBtn.addEventListener('click', () => {
        resetCategoryForm();
    });
}

/**
 * Gère la soumission du formulaire de catégorie
 */
function handleCategorySubmit() {
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const data = loadData();

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }

    if (editingCategoryId !== null) {
        // Modification
        const categoryIndex = data.categories.findIndex(cat => cat.id === editingCategoryId);
        if (categoryIndex !== -1) {
            data.categories[categoryIndex].name = name;
            data.categories[categoryIndex].color = color;
            saveData(data);
            resetCategoryForm();
            renderCategories();
            populateCategorySelect();
            populateBudgetCategorySelect();
            renderGoals();
        }
    } else {
        // Création
        const newCategory = {
            id: Date.now().toString(),
            name: name,
            color: color
        };
        data.categories.push(newCategory);
        saveData(data);
        resetCategoryForm();
        renderCategories();
        populateCategorySelect();
        populateBudgetCategorySelect();
    }
}

/**
 * Réinitialise le formulaire de catégorie
 */
function resetCategoryForm() {
    const form = document.getElementById('category-form');
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const submitBtn = document.getElementById('category-submit');
    const cancelBtn = document.getElementById('category-cancel');
    const formTitle = document.getElementById('category-form-title');

    form.reset();
    colorInput.value = '#3b82f6';
    document.getElementById('color-preview').style.backgroundColor = '#3b82f6';
    editingCategoryId = null;
    submitBtn.textContent = 'Ajouter';
    formTitle.textContent = 'Nouvelle catégorie';
    cancelBtn.style.display = 'none';
}

/**
 * Modifie une catégorie
 */
function editCategory(categoryId) {
    const data = loadData();
    const category = data.categories.find(cat => cat.id === categoryId);

    if (!category) return;

    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const submitBtn = document.getElementById('category-submit');
    const cancelBtn = document.getElementById('category-cancel');
    const formTitle = document.getElementById('category-form-title');
    const colorPreview = document.getElementById('color-preview');

    nameInput.value = category.name;
    colorInput.value = category.color;
    colorPreview.style.backgroundColor = category.color;
    editingCategoryId = categoryId;
    submitBtn.textContent = 'Modifier';
    formTitle.textContent = 'Modifier la catégorie';
    cancelBtn.style.display = 'block';

    // Scroll vers le formulaire
    document.getElementById('category-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Supprime une catégorie
 */
function deleteCategory(categoryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        return;
    }

    const data = loadData();
    data.categories = data.categories.filter(cat => cat.id !== categoryId);
    
    // Supprimer aussi les budgets associés à cette catégorie
    if (data.goals && data.goals.categoryBudgets) {
        data.goals.categoryBudgets = data.goals.categoryBudgets.filter(b => b.categoryId !== categoryId);
    }
    
    saveData(data);
    renderCategories();
    populateCategorySelect();
    populateBudgetCategorySelect();
    renderGoals();
}

/**
 * Affiche les catégories
 */
function renderCategories() {
    const container = document.getElementById('categories-container');
    const data = loadData();
    const categories = data.categories;

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <p>Aucune catégorie pour le moment</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez votre première catégorie ci-dessus</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="category-item">
            <div class="category-color" style="background-color: ${category.color}"></div>
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-actions">
                <button class="btn-edit btn-sm" onclick="editCategory('${category.id}')">
                    Modifier
                </button>
                <button class="btn-delete btn-sm" onclick="deleteCategory('${category.id}')">
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Échappe le HTML pour éviter les injections XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// MODAL DE CRÉATION DE CATÉGORIE
// ============================================

/**
 * Initialise le modal de création de catégorie
 */
function initCategoryModal() {
    const modal = document.getElementById('category-modal');
    const closeBtn = document.getElementById('category-modal-close');
    const cancelBtn = document.getElementById('category-modal-cancel');
    const form = document.getElementById('category-modal-form');
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    if (!modal) return;
    
    // Fermer le modal en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCategoryModal();
        }
    });
    
    // Bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeCategoryModal();
        });
    }
    
    // Bouton d'annulation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeCategoryModal();
        });
    }
    
    // Mise à jour de l'aperçu de couleur
    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
            colorPreview.style.backgroundColor = e.target.value;
        });
        
        // Initialiser l'aperçu de couleur
        colorPreview.style.backgroundColor = colorInput.value;
    }
    
    // Soumission du formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCategoryModalSubmit();
        });
    }
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCategoryModal();
        }
    });
}

/**
 * Ouvre le modal de création de catégorie
 */
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const nameInput = document.getElementById('category-modal-name');
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    if (!modal) return;
    
    // Réinitialiser le formulaire
    document.getElementById('category-modal-form').reset();
    colorInput.value = '#3b82f6';
    colorPreview.style.backgroundColor = '#3b82f6';
    
    // Afficher le modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus sur le champ nom
    setTimeout(() => {
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Ferme le modal de création de catégorie
 */
function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        categoryModalCallback = null;
    }
}

/**
 * Gère la soumission du formulaire du modal
 */
function handleCategoryModalSubmit() {
    const nameInput = document.getElementById('category-modal-name');
    const colorInput = document.getElementById('category-modal-color');
    
    const name = nameInput.value.trim();
    const color = colorInput.value;
    
    if (!name) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }
    
    const data = loadData();
    
    // Créer la catégorie
    const newCategory = {
        id: Date.now().toString(),
        name: name,
        color: color
    };
    
    data.categories.push(newCategory);
    saveData(data);
    
    // Mettre à jour les affichages
    renderCategories();
    populateCategorySelect();
    populateBudgetCategorySelect();
    
    // Si on vient du formulaire de transaction, sélectionner la nouvelle catégorie
    if (categoryModalCallback) {
        closeCategoryModal();
        setTimeout(() => {
            const categorySelect = document.getElementById('transaction-category');
            if (categorySelect) {
                populateCategorySelect();
                categorySelect.value = newCategory.id;
            }
            if (categoryModalCallback) {
                categoryModalCallback(newCategory.id);
                categoryModalCallback = null;
            }
        }, 100);
    } else {
        closeCategoryModal();
    }
}

// ============================================
// GESTION DES TRANSACTIONS
// ============================================

let currentCalendarDate = new Date();

/**
 * Initialise le formulaire de transaction
 */
function initTransactionForm() {
    const form = document.getElementById('transaction-form');
    const dateInput = document.getElementById('transaction-date');
    const createCategoryBtn = document.getElementById('create-category-btn');
    
    // Définir la date par défaut à aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Populate category select
    populateCategorySelect();
    
    // Bouton pour créer une catégorie
    if (createCategoryBtn) {
        createCategoryBtn.addEventListener('click', () => {
            // Définir le callback pour sélectionner la catégorie après création
            categoryModalCallback = (categoryId) => {
                const categorySelect = document.getElementById('transaction-category');
                if (categorySelect) {
                    categorySelect.value = categoryId;
                }
            };
            openCategoryModal();
        });
    }
    
    // Initialiser le modal de catégorie
    initCategoryModal();
    
    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleTransactionSubmit();
    });
}

/**
 * Remplit le select des catégories
 */
function populateCategorySelect() {
    const select = document.getElementById('transaction-category');
    const data = loadData();
    
    select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
    
    data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

/**
 * Gère la soumission du formulaire de transaction
 */
function handleTransactionSubmit() {
    const amountInput = document.getElementById('transaction-amount');
    const dateInput = document.getElementById('transaction-date');
    const typeInput = document.getElementById('transaction-type');
    const categoryInput = document.getElementById('transaction-category');
    const descriptionInput = document.getElementById('transaction-description');
    const recurringInput = document.getElementById('transaction-recurring');
    
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const type = typeInput.value;
    const categoryId = categoryInput.value;
    const description = descriptionInput.value.trim();
    const isRecurring = recurringInput.checked;
    
    if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    if (!categoryId) {
        alert('Veuillez sélectionner une catégorie');
        return;
    }
    
    const data = loadData();
    
    const newTransaction = {
        id: Date.now().toString(),
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        date: date,
        type: type,
        categoryId: categoryId,
        description: description || '',
        recurrence: isRecurring ? 'monthly' : null
    };
    
    data.transactions.push(newTransaction);
    saveData(data);
    
    // Réinitialiser le formulaire
    document.getElementById('transaction-form').reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    recurringInput.checked = false;
    
    // Recharger l'affichage
    renderTransactions();
    if (document.getElementById('calendar').classList.contains('active')) {
        renderCalendar();
    }
    if (document.getElementById('dashboard').classList.contains('active')) {
        renderDashboard();
    }
    if (document.getElementById('goals').classList.contains('active')) {
        renderGoals();
    }
}

/**
 * Obtient toutes les transactions (y compris récurrentes générées)
 */
function getAllTransactions() {
    const data = loadData();
    const transactions = [...data.transactions];
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 12, 0); // 12 mois à l'avance
    
    // Générer les transactions récurrentes
    data.transactions.forEach(transaction => {
        if (transaction.recurrence === 'monthly') {
            const transactionDate = new Date(transaction.date);
            
            // Générer les occurrences mensuelles jusqu'à 12 mois dans le futur
            for (let i = 1; i <= 12; i++) {
                const recurringDate = new Date(transactionDate);
                recurringDate.setMonth(recurringDate.getMonth() + i);
                
                // Ne générer que si la date est dans le futur et dans la plage autorisée
                if (recurringDate <= maxDate) {
                    const dateStr = recurringDate.toISOString().split('T')[0];
                    
                    // Vérifier qu'on n'a pas déjà cette transaction récurrente
                    const exists = transactions.some(t => 
                        t.date === dateStr && 
                        t.categoryId === transaction.categoryId && 
                        t.amount === transaction.amount &&
                        (t.originalId === transaction.id || t.id === transaction.id)
                    );
                    
                    if (!exists) {
                        transactions.push({
                            ...transaction,
                            id: `${transaction.id}_recurring_${i}`,
                            date: dateStr,
                            originalId: transaction.id,
                            isRecurring: true
                        });
                    }
                }
            }
        }
    });
    
    return transactions;
}

/**
 * Affiche les transactions
 */
function renderTransactions() {
    const container = document.getElementById('transactions-container');
    const transactions = getAllTransactions();
    const data = loadData();
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>Aucune transaction pour le moment</p>
                <p style="font-size: 14px; margin-top: 8px;">Ajoutez votre première transaction ci-dessus</p>
            </div>
        `;
        return;
    }
    
    // Trier par date (plus récent en premier)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = transactions.map(transaction => {
        const category = data.categories.find(cat => cat.id === transaction.categoryId);
        const categoryColor = category ? category.color : '#64748b';
        const categoryName = category ? category.name : 'Catégorie supprimée';
        const isIncome = transaction.amount > 0;
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        return `
            <div class="transaction-item ${isIncome ? 'income' : 'expense'}">
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-category-badge" style="background-color: ${categoryColor}"></span>
                        <span class="transaction-category-name">${escapeHtml(categoryName)}</span>
                        ${transaction.recurrence ? '<span class="transaction-recurring-badge">🔄 Mensuel</span>' : ''}
                    </div>
                    ${transaction.description ? `<div class="transaction-description">${escapeHtml(transaction.description)}</div>` : ''}
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : ''}${transaction.amount.toFixed(2)} €
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// GESTION DU CALENDRIER
// ============================================

/**
 * Initialise le calendrier
 */
function initCalendar() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    
    prevBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
}

/**
 * Affiche le calendrier
 */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Afficher le mois et l'année (avec capitalisation)
    const monthYearText = currentCalendarDate.toLocaleDateString('fr-FR', { 
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
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTransactions = transactionsByDate[dateStr];
        const isToday = isCurrentMonth && day === today.getDate();
        
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
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
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
                showDayDetails(date);
            }
        });
    });
}

/**
 * Affiche les détails d'un jour
 */
function showDayDetails(dateStr) {
    const detailsCard = document.getElementById('day-details');
    const detailsTitle = document.getElementById('day-details-title');
    const transactionsList = document.getElementById('day-transactions-list');
    
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
    detailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// TABLEAU DE BORD
// ============================================

let expensesChart = null;
let balanceChart = null;

/**
 * Affiche le tableau de bord avec tous les KPI et graphiques
 */
function renderDashboard() {
    updateSummaryCards();
    renderExpensesChart();
    renderBalanceChart();
    calculatePrediction();
}

/**
 * Met à jour les cartes de résumé
 */
function updateSummaryCards() {
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrer les transactions du mois en cours
    const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Calculer les totaux
    let totalIncome = 0;
    let totalExpenses = 0;
    
    currentMonthTransactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += Math.abs(transaction.amount);
        }
    });
    
    const currentBalance = totalIncome - totalExpenses;
    
    // Mettre à jour l'affichage
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
}

/**
 * Crée le graphique en camembert pour les dépenses par catégorie
 */
function renderExpensesChart() {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrer les dépenses du mois en cours
    const currentMonthExpenses = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               transaction.amount < 0;
    });
    
    // Grouper par catégorie
    const expensesByCategory = {};
    currentMonthExpenses.forEach(transaction => {
        const categoryId = transaction.categoryId;
        if (!expensesByCategory[categoryId]) {
            expensesByCategory[categoryId] = 0;
        }
        expensesByCategory[categoryId] += Math.abs(transaction.amount);
    });
    
    // Préparer les données pour Chart.js
    const labels = [];
    const values = [];
    const colors = [];
    
    Object.keys(expensesByCategory).forEach(categoryId => {
        const category = data.categories.find(cat => cat.id === categoryId);
        if (category) {
            labels.push(category.name);
            values.push(expensesByCategory[categoryId]);
            colors.push(category.color);
        }
    });
    
    // Détruire le graphique existant s'il existe
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    // Créer le nouveau graphique
    if (labels.length === 0) {
        ctx.parentElement.innerHTML = '<p class="placeholder">Aucune dépense ce mois-ci</p>';
        expensesChart = null;
        return;
    }
    
    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée le graphique linéaire pour l'évolution du solde
 */
function renderBalanceChart() {
    const ctx = document.getElementById('balance-chart');
    if (!ctx) return;
    
    const transactions = getAllTransactions();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filtrer les transactions des 30 derniers jours
    const recentTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= thirtyDaysAgo && transactionDate <= today;
    });
    
    // Trier par date
    recentTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Créer un tableau de dates pour les 30 derniers jours
    const dates = [];
    const balances = [];
    let runningBalance = 0;
    
    // Calculer le solde initial (avant les 30 derniers jours)
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < thirtyDaysAgo) {
            runningBalance += transaction.amount;
        }
    });
    
    // Générer les dates des 30 derniers jours
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        
        // Ajouter les transactions de ce jour
        const dateStr = date.toISOString().split('T')[0];
        const dayTransactions = recentTransactions.filter(t => t.date === dateStr);
        dayTransactions.forEach(t => {
            runningBalance += t.amount;
        });
        
        balances.push(runningBalance);
    }
    
    // Détruire le graphique existant s'il existe
    if (balanceChart) {
        balanceChart.destroy();
    }
    
    // Créer le nouveau graphique
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Solde (€)',
                data: balances,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Solde: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Calcule et affiche la prédiction du solde
 */
function calculatePrediction() {
    const allTransactions = getAllTransactions();
    const data = loadData();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - today.getDate();
    
    // Calculer le solde actuel du mois (avec toutes les transactions, y compris récurrentes générées)
    const currentMonthTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    let currentBalance = 0;
    currentMonthTransactions.forEach(transaction => {
        currentBalance += transaction.amount;
    });
    
    // Calculer les revenus récurrents restants (utiliser les transactions originales)
    let remainingIncome = 0;
    const recurringIncomes = data.transactions.filter(t => 
        t.recurrence === 'monthly' && t.amount > 0
    );
    
    recurringIncomes.forEach(income => {
        const incomeDate = new Date(income.date);
        const incomeDay = incomeDate.getDate();
        
        // Si la date de récurrence est après aujourd'hui ce mois-ci
        if (incomeDay > today.getDate() && 
            incomeDate.getMonth() === currentMonth && 
            incomeDate.getFullYear() === currentYear) {
            remainingIncome += income.amount;
        }
    });
    
    // Calculer les dépenses récurrentes restantes (utiliser les transactions originales)
    let remainingExpenses = 0;
    const recurringExpenses = data.transactions.filter(t => 
        t.recurrence === 'monthly' && t.amount < 0
    );
    
    recurringExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const expenseDay = expenseDate.getDate();
        
        // Si la date de récurrence est après aujourd'hui ce mois-ci
        if (expenseDay > today.getDate() && 
            expenseDate.getMonth() === currentMonth && 
            expenseDate.getFullYear() === currentYear) {
            remainingExpenses += Math.abs(expense.amount);
        }
    });
    
    // Calculer la moyenne des dépenses quotidiennes passées (hors récurrentes)
    const pastExpenses = currentMonthTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.amount < 0 && 
               transactionDate <= today &&
               !t.isRecurring; // Exclure les transactions récurrentes générées pour le calcul de la moyenne
    });
    
    const totalPastExpenses = pastExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const daysPassed = today.getDate();
    const avgDailyExpenses = daysPassed > 0 ? totalPastExpenses / daysPassed : 0;
    const estimatedFutureExpenses = avgDailyExpenses * daysRemaining;
    
    // Calculer le solde estimé
    const predictedBalance = currentBalance + remainingIncome - remainingExpenses - estimatedFutureExpenses;
    
    // Mettre à jour l'affichage
    document.getElementById('prediction-current-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('prediction-remaining-income').textContent = formatCurrency(remainingIncome);
    document.getElementById('prediction-remaining-expenses').textContent = formatCurrency(remainingExpenses);
    document.getElementById('prediction-avg-daily').textContent = formatCurrency(estimatedFutureExpenses);
    document.getElementById('predicted-balance').textContent = formatCurrency(predictedBalance);
    
    // Changer la couleur selon si positif ou négatif
    const predictedElement = document.getElementById('predicted-balance');
    predictedElement.style.color = predictedBalance >= 0 ? 'var(--success)' : 'var(--danger)';
}

/**
 * Formate un montant en devise
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ============================================
// GESTION DES OBJECTIFS
// ============================================

/**
 * Initialise la page des objectifs
 */
function initGoals() {
    const incomeGoalForm = document.getElementById('income-goal-form');
    const categoryBudgetForm = document.getElementById('category-budget-form');
    
    if (incomeGoalForm) {
        incomeGoalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleIncomeGoalSubmit();
        });
    }
    
    if (categoryBudgetForm) {
        categoryBudgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCategoryBudgetSubmit();
        });
    }
}

/**
 * Gère la soumission de l'objectif de revenu
 */
function handleIncomeGoalSubmit() {
    const amountInput = document.getElementById('income-goal-amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    const data = loadData();
    if (!data.goals) {
        data.goals = { incomeGoal: null, categoryBudgets: [] };
    }
    data.goals.incomeGoal = amount;
    saveData(data);
    
    amountInput.value = '';
    renderGoals();
    renderDashboard(); // Mettre à jour le tableau de bord
}

/**
 * Gère la soumission d'un budget de catégorie
 */
function handleCategoryBudgetSubmit() {
    const categorySelect = document.getElementById('budget-category');
    const amountInput = document.getElementById('budget-amount');
    
    const categoryId = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!categoryId) {
        alert('Veuillez sélectionner une catégorie');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    const data = loadData();
    if (!data.goals) {
        data.goals = { incomeGoal: null, categoryBudgets: [] };
    }
    
    // Vérifier si le budget existe déjà
    const existingBudgetIndex = data.goals.categoryBudgets.findIndex(b => b.categoryId === categoryId);
    
    if (existingBudgetIndex !== -1) {
        data.goals.categoryBudgets[existingBudgetIndex].amount = amount;
    } else {
        data.goals.categoryBudgets.push({
            id: Date.now().toString(),
            categoryId: categoryId,
            amount: amount
        });
    }
    
    saveData(data);
    
    document.getElementById('category-budget-form').reset();
    populateBudgetCategorySelect();
    renderGoals();
    renderDashboard(); // Mettre à jour le tableau de bord
}

/**
 * Supprime un budget de catégorie
 */
function deleteCategoryBudget(budgetId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
        return;
    }
    
    const data = loadData();
    if (data.goals && data.goals.categoryBudgets) {
        data.goals.categoryBudgets = data.goals.categoryBudgets.filter(b => b.id !== budgetId);
        saveData(data);
        renderGoals();
        renderDashboard();
    }
}

/**
 * Remplit le select des catégories pour les budgets
 */
function populateBudgetCategorySelect() {
    const select = document.getElementById('budget-category');
    if (!select) return;
    
    const data = loadData();
    
    select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
    
    data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        
        // Indiquer si la catégorie a déjà un budget
        const existingBudget = data.goals?.categoryBudgets?.find(b => b.categoryId === category.id);
        if (existingBudget) {
            option.textContent += ` (Budget: ${formatCurrency(existingBudget.amount)})`;
        }
        
        select.appendChild(option);
    });
}

/**
 * Affiche la page des objectifs
 */
function renderGoals() {
    const data = loadData();
    const goals = data.goals || { incomeGoal: null, categoryBudgets: [] };
    
    // Afficher l'objectif de revenu
    renderIncomeGoal(goals.incomeGoal);
    
    // Afficher les budgets par catégorie
    renderCategoryBudgets(goals.categoryBudgets || []);
    
    // Remplir le select des catégories
    populateBudgetCategorySelect();
}

/**
 * Affiche l'objectif de revenu avec la barre de progression
 */
function renderIncomeGoal(incomeGoal) {
    const amountInput = document.getElementById('income-goal-amount');
    const progressContainer = document.getElementById('income-goal-progress');
    const progressBar = document.getElementById('income-goal-progress-bar');
    const statusElement = document.getElementById('income-goal-status');
    const currentElement = document.getElementById('income-goal-current');
    const targetElement = document.getElementById('income-goal-target');
    
    if (!incomeGoal) {
        progressContainer.style.display = 'none';
        return;
    }
    
    // Calculer le revenu actuel du mois
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const currentMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const progress = Math.min((currentMonthIncome / incomeGoal) * 100, 100);
    
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    currentElement.textContent = formatCurrency(currentMonthIncome);
    targetElement.textContent = formatCurrency(incomeGoal);
    
    // Déterminer le statut
    if (progress >= 100) {
        statusElement.textContent = '✓ Objectif atteint';
        statusElement.className = 'goal-progress-status success';
        progressBar.className = 'progress-fill';
    } else if (progress >= 75) {
        statusElement.textContent = 'Presque atteint';
        statusElement.className = 'goal-progress-status warning';
        progressBar.className = 'progress-fill warning';
    } else {
        statusElement.textContent = 'En cours';
        statusElement.className = 'goal-progress-status';
        progressBar.className = 'progress-fill';
    }
}

/**
 * Affiche les budgets par catégorie avec les barres de progression
 */
function renderCategoryBudgets(budgets) {
    const container = document.getElementById('budgets-container');
    if (!container) return;
    
    const data = loadData();
    const transactions = getAllTransactions();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p>Aucun budget défini</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez votre premier budget ci-dessus</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = budgets.map(budget => {
        const category = data.categories.find(c => c.id === budget.categoryId);
        if (!category) return ''; // Catégorie supprimée
        
        // Calculer les dépenses de cette catégorie ce mois-ci
        const categoryExpenses = transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear &&
                       t.categoryId === budget.categoryId &&
                       t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const progress = Math.min((categoryExpenses / budget.amount) * 100, 100);
        const remaining = budget.amount - categoryExpenses;
        
        let progressClass = '';
        let statusText = '';
        if (progress >= 100) {
            progressClass = 'danger';
            statusText = 'Budget dépassé';
        } else if (progress >= 80) {
            progressClass = 'warning';
            statusText = 'Attention';
        } else {
            statusText = 'Dans les limites';
        }
        
        return `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-category-info">
                        <div class="budget-category-color" style="background-color: ${category.color}"></div>
                        <div class="budget-category-name">${escapeHtml(category.name)}</div>
                    </div>
                    <div class="budget-amount">${formatCurrency(budget.amount)}</div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${progress}%">
                            ${progress >= 50 ? `${progress.toFixed(0)}%` : ''}
                        </div>
                    </div>
                </div>
                <div class="budget-details">
                    <span class="budget-spent">Dépensé: ${formatCurrency(categoryExpenses)}</span>
                    <span class="budget-remaining ${remaining >= 0 ? 'positive' : 'negative'}">
                        Restant: ${formatCurrency(remaining)}
                    </span>
                </div>
                <div class="budget-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteCategoryBudget('${budget.id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }).filter(html => html !== '').join('');
}

// ============================================
// BACKUP ET IMPORT
// ============================================

/**
 * Initialise les fonctions de backup et import
 */
function initBackupImport() {
    const backupJsonBtn = document.getElementById('backup-json');
    const backupTxtBtn = document.getElementById('backup-txt');
    const importBtn = document.getElementById('import-button');
    const importFile = document.getElementById('import-file');
    
    if (backupJsonBtn) {
        backupJsonBtn.addEventListener('click', () => downloadBackup('json'));
    }
    
    if (backupTxtBtn) {
        backupTxtBtn.addEventListener('click', () => downloadBackup('txt'));
    }
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            importFile.click();
        });
        
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importBackup(file);
            }
        });
    }
}

/**
 * Télécharge les données en backup
 */
function downloadBackup(format) {
    const data = loadData();
    const timestamp = new Date().toISOString().split('T')[0];
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `pecule_backup_${timestamp}.json`;
        mimeType = 'application/json';
    } else {
        // Format TXT lisible
        content = `=== SAUVEGARDE PÉCULE ===\n`;
        content += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
        content += `=== CATÉGORIES ===\n`;
        data.categories.forEach(cat => {
            content += `- ${cat.name} (${cat.color})\n`;
        });
        content += `\n=== TRANSACTIONS ===\n`;
        data.transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('fr-FR');
            const type = t.amount > 0 ? 'Revenu' : 'Dépense';
            content += `${date} | ${type} | ${Math.abs(t.amount).toFixed(2)}€ | ${t.description || 'Sans description'}\n`;
        });
        content += `\n=== OBJECTIFS ===\n`;
        if (data.goals) {
            if (data.goals.incomeGoal) {
                content += `Objectif de revenu: ${data.goals.incomeGoal}€\n`;
            }
            if (data.goals.categoryBudgets && data.goals.categoryBudgets.length > 0) {
                content += `Budgets par catégorie:\n`;
                data.goals.categoryBudgets.forEach(b => {
                    const cat = data.categories.find(c => c.id === b.categoryId);
                    content += `- ${cat ? cat.name : 'Catégorie supprimée'}: ${b.amount}€\n`;
                });
            }
        }
        content += `\n=== DONNÉES JSON ===\n${JSON.stringify(data, null, 2)}`;
        filename = `pecule_backup_${timestamp}.txt`;
        mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Sauvegarde téléchargée avec succès !');
}

/**
 * Importe les données depuis un fichier
 */
function importBackup(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            let data;
            const content = e.target.result;
            
            // Essayer de parser comme JSON d'abord
            try {
                data = JSON.parse(content);
            } catch (jsonError) {
                // Si ce n'est pas du JSON, essayer d'extraire le JSON depuis le fichier TXT
                const jsonMatch = content.match(/=== DONNÉES JSON ===\s*([\s\S]*)$/);
                if (jsonMatch) {
                    data = JSON.parse(jsonMatch[1]);
                } else {
                    throw new Error('Format de fichier non reconnu');
                }
            }
            
            // Valider la structure des données
            if (!data.categories || !data.transactions || !data.goals) {
                throw new Error('Structure de données invalide');
            }
            
            // Demander confirmation
            if (!confirm('⚠️ Cette opération va écraser toutes vos données actuelles. Êtes-vous sûr de vouloir continuer ?')) {
                return;
            }
            
            // Sauvegarder les données
            saveData(data);
            
            // Recharger toutes les pages
            renderCategories();
            renderTransactions();
            renderCalendar();
            renderDashboard();
            renderGoals();
            populateCategorySelect();
            
            alert('Données restaurées avec succès !');
            
            // Réinitialiser l'input file
            document.getElementById('import-file').value = '';
        } catch (error) {
            alert('Erreur lors de l\'import : ' + error.message);
            console.error('Erreur d\'import:', error);
        }
    };
    
    reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsText(file);
}

// ============================================
// INITIALISATION
// ============================================

function init() {
    // Initialiser la navigation
    initNavigation();

    // Initialiser le formulaire de catégorie
    initCategoryForm();
    
    // Initialiser le formulaire de transaction
    initTransactionForm();
    
    // Initialiser le calendrier
    initCalendar();

    // Charger et afficher les catégories
    renderCategories();
    
    // Charger et afficher les transactions
    renderTransactions();
    
    // Initialiser le calendrier
    renderCalendar();
    
    // Initialiser le tableau de bord
    renderDashboard();

    // Initialiser les données si elles n'existent pas
    const data = loadData();
    if (data.categories.length === 0 && data.transactions.length === 0 && 
        (!data.goals || (!data.goals.incomeGoal && data.goals.categoryBudgets.length === 0))) {
        saveData(defaultData);
    }
    
    // Initialiser les objectifs
    initGoals();
    
    // Initialiser le backup/import
    initBackupImport();
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

