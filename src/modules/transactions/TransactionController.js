import { loadData, saveData } from '../shared/index.js';
import { populateCategorySelect, renderTransactions, updateCategoryColorIndicator } from './TransactionRenderer.js';
import { getRecurrenceConfig, resetRecurrenceConfig } from './RecurrenceController.js';
import { initDateSelector } from './DateSelector.js';

// Stocker les instances des sélecteurs de date
let transactionDateSelector = null;
let editTransactionDateSelector = null;

/**
 * Initialise le formulaire de transaction
 */
export function initTransactionForm() {
    const form = document.getElementById('transaction-form');
    const createCategoryBtn = document.getElementById('create-category-btn');
    const categorySelect = document.getElementById('transaction-category');
    
    if (!form) return;
    
    // Initialiser le sélecteur de date personnalisé
    transactionDateSelector = initDateSelector('transaction-date');
    
    // Populate category select
    populateCategorySelect();
    
    // Mettre à jour l'indicateur de couleur quand la sélection change
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateCategoryColorIndicator();
        });
        // Mettre à jour l'indicateur initial
        updateCategoryColorIndicator();
    }
    
    // Bouton pour créer une catégorie
    if (createCategoryBtn) {
        createCategoryBtn.addEventListener('click', () => {
            // Définir le callback pour sélectionner la catégorie après création
            const callback = (categoryId) => {
                if (categorySelect) {
                    categorySelect.value = categoryId;
                    updateCategoryColorIndicator();
                }
            };
            // Utiliser la fonction globale
            if (window.openCategoryModal) {
                window.openCategoryModal(callback);
            }
        });
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleTransactionSubmit();
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
    
    // Obtenir la configuration de récurrence si activée
    const recurrenceConfig = isRecurring ? getRecurrenceConfig() : null;
    
    const newTransaction = {
        id: Date.now().toString(),
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        date: date,
        type: type,
        categoryId: categoryId,
        description: description || '',
        recurrence: recurrenceConfig
    };
    
    data.transactions.push(newTransaction);
    saveData(data);
    
    // Réinitialiser le formulaire
    const form = document.getElementById('transaction-form');
    if (form) form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (typeInput) typeInput.value = 'expense'; // Par défaut sur "Dépense"
    resetRecurrenceConfig();
    
    // Réinitialiser le select de catégorie pour afficher le placeholder
    populateCategorySelect();
    
    // Recharger l'affichage
    renderTransactions();
    // Notifier les autres modules
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderGoals) window.renderGoals();
}

