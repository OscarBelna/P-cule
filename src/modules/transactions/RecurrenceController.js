import { initDateSelector } from './DateSelector.js';

// État de la configuration de récurrence
let recurrenceConfig = {
    type: 'monthly',
    endDate: null
};

// Stocker l'instance du sélecteur de date pour la récurrence
let recurrenceDateSelector = null;

/**
 * Initialise le modal de configuration de récurrence
 */
export function initRecurrenceModal() {
    // Initialiser le sélecteur de date personnalisé (avec possibilité d'effacer)
    recurrenceDateSelector = initDateSelector('recurrence-end-date', true);
    const modal = document.getElementById('recurrence-modal');
    const closeBtn = document.getElementById('recurrence-modal-close');
    const cancelBtn = document.getElementById('recurrence-modal-cancel');
    const form = document.getElementById('recurrence-form');
    const configureBtn = document.getElementById('configure-recurrence-btn');
    const editConfigureBtn = document.getElementById('edit-configure-recurrence-btn');
    const recurringCheckbox = document.getElementById('transaction-recurring');
    const editRecurringCheckbox = document.getElementById('edit-transaction-recurring');
    const recurringText = document.getElementById('recurring-text');
    const editRecurringText = document.getElementById('edit-recurring-text');
    
    if (!modal) return;
    
    // Mettre à jour le texte quand le checkbox change (formulaire principal)
    if (recurringCheckbox) {
        recurringCheckbox.addEventListener('change', (e) => {
            updateRecurringText();
        });
    }
    
    // Mettre à jour le texte quand le checkbox change (formulaire d'édition)
    if (editRecurringCheckbox) {
        editRecurringCheckbox.addEventListener('change', (e) => {
            updateEditRecurringText();
        });
    }
    
    // Ouvrir le modal de configuration (formulaire principal)
    if (configureBtn) {
        configureBtn.addEventListener('click', () => {
            openRecurrenceModal(false);
        });
    }
    
    // Ouvrir le modal de configuration (formulaire d'édition)
    if (editConfigureBtn) {
        editConfigureBtn.addEventListener('click', () => {
            openRecurrenceModal(true);
        });
    }
    
    // Fermer le modal en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRecurrenceModal();
        }
    });
    
    // Bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeRecurrenceModal();
        });
    }
    
    // Bouton d'annulation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeRecurrenceModal();
        });
    }
    
    // Soumission du formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRecurrenceSubmit();
        });
    }
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeRecurrenceModal();
        }
    });
    
    // Initialiser le texte
    updateRecurringText();
}

// Variable pour savoir si on est en mode édition
let isEditMode = false;

/**
 * Ouvre le modal de configuration de récurrence
 * @param {boolean} editMode - true si on est en mode édition
 */
function openRecurrenceModal(editMode = false) {
    isEditMode = editMode;
    const modal = document.getElementById('recurrence-modal');
    const typeSelect = document.getElementById('recurrence-type');
    const endDateInput = document.getElementById('recurrence-end-date');
    const dateTextEl = document.getElementById('recurrence-end-date-text');
    
    if (!modal) return;
    
    // Remplir avec les valeurs actuelles
    if (typeSelect) typeSelect.value = recurrenceConfig.type || 'monthly';
    if (endDateInput) {
        endDateInput.value = recurrenceConfig.endDate || '';
        // Mettre à jour le sélecteur de date personnalisé
        if (recurrenceDateSelector) {
            if (recurrenceConfig.endDate) {
                recurrenceDateSelector.setDate(recurrenceConfig.endDate);
            } else {
                // Réinitialiser à "Aucune date"
                recurrenceDateSelector.clearDate();
            }
        }
    }
    
    // Afficher le modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme le modal de configuration de récurrence
 */
function closeRecurrenceModal() {
    const modal = document.getElementById('recurrence-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Gère la soumission du formulaire de récurrence
 */
function handleRecurrenceSubmit() {
    const typeSelect = document.getElementById('recurrence-type');
    const endDateInput = document.getElementById('recurrence-end-date');
    
    recurrenceConfig.type = typeSelect.value;
    recurrenceConfig.endDate = endDateInput.value || null;
    
    // Mettre à jour le texte selon le mode
    if (isEditMode) {
        updateEditRecurringText();
    } else {
        updateRecurringText();
    }
    closeRecurrenceModal();
}

/**
 * Met à jour le texte du toggle de récurrence (formulaire principal)
 */
function updateRecurringText() {
    const recurringText = document.getElementById('recurring-text');
    const recurringCheckbox = document.getElementById('transaction-recurring');
    
    if (!recurringText || !recurringCheckbox) return;
    
    if (!recurringCheckbox.checked) {
        recurringText.textContent = 'Récurrent';
        return;
    }
    
    const typeLabels = {
        daily: 'Journalière',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuelle',
        quarterly: 'Trimestrielle',
        yearly: 'Annuelle'
    };
    
    const typeLabel = typeLabels[recurrenceConfig.type] || 'Mensuelle';
    let text = `Récurrent (${typeLabel})`;
    
    if (recurrenceConfig.endDate) {
        const endDate = new Date(recurrenceConfig.endDate);
        const formattedDate = endDate.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        text += ` jusqu'au ${formattedDate}`;
    }
    
    recurringText.textContent = text;
}

/**
 * Met à jour le texte du toggle de récurrence (formulaire d'édition)
 */
function updateEditRecurringText() {
    const editRecurringText = document.getElementById('edit-recurring-text');
    const editRecurringCheckbox = document.getElementById('edit-transaction-recurring');
    
    if (!editRecurringText || !editRecurringCheckbox) return;
    
    if (!editRecurringCheckbox.checked) {
        editRecurringText.textContent = 'Récurrent';
        return;
    }
    
    const typeLabels = {
        daily: 'Journalière',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuelle',
        quarterly: 'Trimestrielle',
        yearly: 'Annuelle'
    };
    
    const typeLabel = typeLabels[recurrenceConfig.type] || 'Mensuelle';
    let text = `Récurrent (${typeLabel})`;
    
    if (recurrenceConfig.endDate) {
        const endDate = new Date(recurrenceConfig.endDate);
        const formattedDate = endDate.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        text += ` jusqu'au ${formattedDate}`;
    }
    
    editRecurringText.textContent = text;
}

/**
 * Obtient la configuration de récurrence actuelle
 * @param {boolean} isEditMode - true si on est en mode édition
 */
export function getRecurrenceConfig(isEditMode = false) {
    const recurringCheckbox = isEditMode 
        ? document.getElementById('edit-transaction-recurring')
        : document.getElementById('transaction-recurring');
    
    if (!recurringCheckbox || !recurringCheckbox.checked) {
        return null;
    }
    
    return {
        type: recurrenceConfig.type,
        endDate: recurrenceConfig.endDate
    };
}

/**
 * Réinitialise la configuration de récurrence
 */
export function resetRecurrenceConfig() {
    recurrenceConfig = {
        type: 'monthly',
        endDate: null
    };
    updateRecurringText();
    updateEditRecurringText();
    
    const recurringCheckbox = document.getElementById('transaction-recurring');
    if (recurringCheckbox) recurringCheckbox.checked = false;
    
    const editRecurringCheckbox = document.getElementById('edit-transaction-recurring');
    if (editRecurringCheckbox) editRecurringCheckbox.checked = false;
}

/**
 * Charge la configuration de récurrence depuis une transaction
 */
export function loadRecurrenceFromTransaction(transaction) {
    if (transaction.recurrence) {
        // Gérer l'ancien format (string) et le nouveau format (objet)
        if (typeof transaction.recurrence === 'string') {
            recurrenceConfig.type = transaction.recurrence;
            recurrenceConfig.endDate = null;
        } else {
            recurrenceConfig.type = transaction.recurrence.type || 'monthly';
            recurrenceConfig.endDate = transaction.recurrence.endDate || null;
        }
        
        const editRecurringCheckbox = document.getElementById('edit-transaction-recurring');
        if (editRecurringCheckbox) {
            editRecurringCheckbox.checked = true;
        }
        updateEditRecurringText();
    } else {
        resetRecurrenceConfig();
    }
}

