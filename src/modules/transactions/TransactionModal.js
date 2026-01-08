import { loadData, saveData } from '../shared/index.js';
import { renderTransactions } from './TransactionRenderer.js';
import { loadRecurrenceFromTransaction, getRecurrenceConfig, resetRecurrenceConfig } from './RecurrenceController.js';
import { initDateSelector } from './DateSelector.js';
import { getTransactionFilters } from './TransactionFiltersController.js';

// Stocker l'instance du sélecteur de date pour l'édition
let editTransactionDateSelector = null;

/**
 * Initialise le modal de modification de transaction
 */
export function initEditTransactionModal() {
    const modal = document.getElementById('edit-transaction-modal');
    const closeBtn = document.getElementById('edit-transaction-modal-close');
    const cancelBtn = document.getElementById('edit-transaction-cancel');
    const form = document.getElementById('edit-transaction-form');
    
    if (!modal) return;
    
    // Initialiser le sélecteur de date personnalisé
    editTransactionDateSelector = initDateSelector('edit-transaction-date');
    
    // Fermer le modal en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditTransactionModal();
        }
    });
    
    // Bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeEditTransactionModal();
        });
    }
    
    // Bouton d'annulation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeEditTransactionModal();
        });
    }
    
    // Soumission du formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleEditTransactionSubmit();
        });
    }
    
    // Mettre à jour la couleur du select quand la catégorie change
    const categorySelect = document.getElementById('edit-transaction-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateEditCategoryColorIndicator();
        });
    }
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeEditTransactionModal();
        }
    });
}

/**
 * Met à jour l'indicateur de couleur de la catégorie sélectionnée dans le modal de modification
 */
function updateEditCategoryColorIndicator() {
    const select = document.getElementById('edit-transaction-category');
    
    if (!select) return;
    
    const selectedCategoryId = select.value;
    
    if (!selectedCategoryId) {
        select.style.color = ''; // Réinitialiser la couleur du select
        return;
    }
    
    const data = loadData();
    const category = data.categories.find(cat => cat.id === selectedCategoryId);
    
    if (category && category.color) {
        // Colorer le texte du select avec la couleur de la catégorie
        select.style.color = category.color;
    } else {
        select.style.color = '';
    }
}

/**
 * Ouvre le modal de modification de transaction
 */
export function openEditTransactionModal(transactionId) {
    const modal = document.getElementById('edit-transaction-modal');
    const data = loadData();
    
    if (!modal) return;
    
    // Trouver la transaction (seulement dans les transactions originales)
    const transaction = data.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        alert('Transaction introuvable');
        return;
    }
    
    // Remplir le formulaire avec les données de la transaction
    const idInput = document.getElementById('edit-transaction-id');
    const amountInput = document.getElementById('edit-transaction-amount');
    const dateInput = document.getElementById('edit-transaction-date');
    const typeInput = document.getElementById('edit-transaction-type');
    const descriptionInput = document.getElementById('edit-transaction-description');
    const recurringInput = document.getElementById('edit-transaction-recurring');
    
    if (idInput) idInput.value = transaction.id;
    if (amountInput) amountInput.value = Math.abs(transaction.amount);
    if (dateInput) {
        dateInput.value = transaction.date;
        // Mettre à jour le sélecteur de date personnalisé
        if (editTransactionDateSelector) {
            editTransactionDateSelector.setDate(transaction.date);
        }
    }
    if (typeInput) typeInput.value = transaction.amount > 0 ? 'income' : 'expense';
    if (descriptionInput) descriptionInput.value = transaction.description || '';
    // Charger la configuration de récurrence
    if (transaction.recurrence) {
        loadRecurrenceFromTransaction(transaction);
    } else {
        resetRecurrenceConfig();
    }
    
    // Remplir le select des catégories avec les couleurs
    const categorySelect = document.getElementById('edit-transaction-category');
    if (categorySelect) {
        categorySelect.innerHTML = '';
        
        // Ajouter les catégories avec les ronds de couleur
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            // Ajouter le rond de couleur dans la liste déroulante
            option.textContent = `⬤ ${category.name}`;
            // Stocker le nom sans le rond pour l'affichage sélectionné
            option.dataset.name = category.name;
            // Colorer le texte de l'option avec la couleur de la catégorie
            option.style.color = category.color;
            if (category.id === transaction.categoryId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
        
        // Mettre à jour la couleur du select avec la catégorie sélectionnée
        const selectedCategory = data.categories.find(cat => cat.id === transaction.categoryId);
        if (selectedCategory && selectedCategory.color) {
            categorySelect.style.color = selectedCategory.color;
        }
    }
    
    // Afficher le modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme le modal de modification de transaction
 */
export function closeEditTransactionModal() {
    const modal = document.getElementById('edit-transaction-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const form = document.getElementById('edit-transaction-form');
        if (form) form.reset();
        // Réinitialiser la configuration de récurrence
        resetRecurrenceConfig();
    }
}

/**
 * Affiche le popup de confirmation de suppression
 */
export function showDeleteConfirmation(transactionId, buttonElement) {
    const popup = document.getElementById('delete-confirmation-popup');
    const confirmBtn = document.getElementById('delete-confirm-btn');
    const cancelBtn = document.getElementById('delete-cancel-btn');
    
    if (!popup) return;
    
    // Positionner le popup au-dessus du bouton
    const buttonRect = buttonElement.getBoundingClientRect();
    const popupContent = popup.querySelector('.delete-popup-content');
    
    // Calculer la position (au-dessus du bouton, centré horizontalement)
    const popupTop = buttonRect.top - popupContent.offsetHeight - 8; // 8px d'espace
    const popupLeft = buttonRect.left + (buttonRect.width / 2) - (popupContent.offsetWidth / 2);
    
    // Ajuster si le popup dépasse à gauche ou à droite
    const adjustedLeft = Math.max(10, Math.min(popupLeft, window.innerWidth - popupContent.offsetWidth - 10));
    
    popup.style.top = `${popupTop}px`;
    popup.style.left = `${adjustedLeft}px`;
    
    // Afficher le popup
    popup.classList.add('active');
    
    // Gérer la confirmation
    const handleConfirm = () => {
        confirmDeleteTransaction(transactionId);
        closeDeleteConfirmation();
    };
    
    // Gérer l'annulation
    const handleCancel = () => {
        closeDeleteConfirmation();
    };
    
    // Nettoyer les anciens event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Ajouter les nouveaux event listeners
    newConfirmBtn.addEventListener('click', handleConfirm);
    newCancelBtn.addEventListener('click', handleCancel);
    
    // Fermer en cliquant en dehors
    const handleClickOutside = (e) => {
        if (!popupContent.contains(e.target) && !buttonElement.contains(e.target)) {
            closeDeleteConfirmation();
            document.removeEventListener('click', handleClickOutside);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
}

/**
 * Ferme le popup de confirmation
 */
function closeDeleteConfirmation() {
    const popup = document.getElementById('delete-confirmation-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}

/**
 * Confirme et supprime la transaction
 */
function confirmDeleteTransaction(transactionId) {
    const data = loadData();
    
    // Trouver et supprimer la transaction
    const transactionIndex = data.transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex === -1) {
        alert('Transaction introuvable');
        return;
    }
    
    // Supprimer la transaction
    data.transactions.splice(transactionIndex, 1);
    saveData(data);
    
    // Recharger l'affichage en préservant les filtres actuels
    const filters = getTransactionFilters();
    renderTransactions(filters.month, filters.year, filters.categoryId, filters.recurrence);
    // Notifier les autres modules
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderGoals) window.renderGoals();
}

/**
 * Supprime une transaction (affiche le popup de confirmation)
 */
export function deleteTransaction(transactionId, buttonElement) {
    if (buttonElement) {
        showDeleteConfirmation(transactionId, buttonElement);
    } else {
        // Fallback si on ne peut pas trouver le bouton
        if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.')) {
            confirmDeleteTransaction(transactionId);
        }
    }
}

/**
 * Gère la soumission du formulaire de modification
 */
function handleEditTransactionSubmit() {
    const transactionIdInput = document.getElementById('edit-transaction-id');
    const amountInput = document.getElementById('edit-transaction-amount');
    const dateInput = document.getElementById('edit-transaction-date');
    const typeInput = document.getElementById('edit-transaction-type');
    const categoryInput = document.getElementById('edit-transaction-category');
    const descriptionInput = document.getElementById('edit-transaction-description');
    const recurringInput = document.getElementById('edit-transaction-recurring');
    
    const transactionId = transactionIdInput.value;
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
    
    // Trouver et modifier la transaction
    const transactionIndex = data.transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex === -1) {
        alert('Transaction introuvable');
        return;
    }
    
    // Mettre à jour la transaction
    data.transactions[transactionIndex].amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    data.transactions[transactionIndex].date = date;
    data.transactions[transactionIndex].type = type;
    data.transactions[transactionIndex].categoryId = categoryId;
    data.transactions[transactionIndex].description = description;
    // Obtenir la configuration de récurrence si activée (mode édition)
    const recurrenceConfig = isRecurring ? getRecurrenceConfig(true) : null;
    
    data.transactions[transactionIndex].recurrence = recurrenceConfig;
    
    saveData(data);
    
    // Fermer le modal
    closeEditTransactionModal();
    
    // Réinitialiser la configuration de récurrence
    resetRecurrenceConfig();
    
    // Recharger l'affichage en préservant les filtres actuels
    const filters = getTransactionFilters();
    renderTransactions(filters.month, filters.year, filters.categoryId, filters.recurrence);
    // Notifier les autres modules
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderGoals) window.renderGoals();
}

// Exporter pour utilisation globale (onclick dans HTML)
window.openEditTransactionModal = openEditTransactionModal;
window.deleteTransaction = deleteTransaction;

