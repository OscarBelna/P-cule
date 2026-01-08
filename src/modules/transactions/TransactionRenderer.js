import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';

/**
 * Obtient le label de récurrence pour l'affichage
 */
function getRecurrenceLabel(recurrence) {
    if (!recurrence) return '';
    
    const type = typeof recurrence === 'string' ? recurrence : recurrence.type;
    const labels = {
        daily: 'Journalier',
        weekly: 'Hebdomadaire',
        bimonthly: 'Bimensuel',
        monthly: 'Mensuel',
        quarterly: 'Trimestriel',
        yearly: 'Annuel'
    };
    
    return labels[type] || 'Mensuel';
}

/**
 * Remplit le select des catégories pour les transactions
 * @param {boolean} forceReset - Si true, force la réinitialisation au placeholder
 */
export function populateCategorySelect(forceReset = false) {
    const select = document.getElementById('transaction-category');
    if (!select) return;
    
    const data = loadData();
    const currentValue = forceReset ? '' : select.value; // Sauvegarder la valeur actuelle (ou forcer à vide)
    
    select.innerHTML = '';
    
    // Ajouter les catégories
    data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        // Ajouter le rond de couleur dans la liste déroulante
        option.textContent = `⬤ ${category.name}`;
        // Stocker le nom sans le rond pour l'affichage sélectionné
        option.dataset.name = category.name;
        // Colorer le texte de l'option avec la couleur de la catégorie
        option.style.color = category.color;
        select.appendChild(option);
    });
    
    // Restaurer la valeur sélectionnée ou ajouter le placeholder si aucune catégorie n'est sélectionnée
    if (currentValue && data.categories.find(cat => cat.id === currentValue)) {
        select.value = currentValue;
    } else {
        // Ajouter l'option placeholder seulement quand aucune catégorie n'est sélectionnée
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Sélectionnez une catégorie';
        placeholderOption.disabled = true;
        placeholderOption.hidden = true;
        select.insertBefore(placeholderOption, select.firstChild);
        select.value = '';
        select.selectedIndex = 0; // Sélectionner le placeholder
    }
    
    // Mettre à jour l'indicateur de couleur après avoir peuplé le select
    updateCategoryColorIndicator();
}

/**
 * Met à jour l'indicateur de couleur de la catégorie sélectionnée
 */
export function updateCategoryColorIndicator() {
    const select = document.getElementById('transaction-category');
    const colorIndicator = document.getElementById('transaction-category-color');
    
    if (!select || !colorIndicator) return;
    
    const selectedCategoryId = select.value;
    
    // Toujours masquer l'indicateur de couleur (le rond est déjà dans le texte de l'option)
    colorIndicator.style.display = 'none';
    
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
 * Affiche les transactions
 */
export function renderTransactions() {
    const container = document.getElementById('transactions-container');
    if (!container) return;
    
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    // Filtrer pour ne garder que les transactions originales (pas les récurrentes générées)
    const transactions = allTransactions.filter(transaction => {
        // Garder seulement les transactions originales (pas celles générées automatiquement)
        return !transaction.isRecurring && !transaction.originalId;
    });
    
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
        
        // Ne permettre la modification que pour les transactions originales (pas les récurrentes générées)
        const canEdit = !transaction.isRecurring && !transaction.originalId;
        
        return `
            <div class="transaction-item ${isIncome ? 'income' : 'expense'}">
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-category-badge" style="background-color: ${categoryColor}"></span>
                        <span class="transaction-category-name">${escapeHtml(categoryName)}</span>
                        ${transaction.recurrence ? `<span class="transaction-recurring-badge">🔄 ${getRecurrenceLabel(transaction.recurrence)}</span>` : ''}
                    </div>
                    ${transaction.description ? `<div class="transaction-description">${escapeHtml(transaction.description)}</div>` : ''}
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                 <div class="transaction-actions-amount">
                     <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                         ${isIncome ? '+' : ''}${transaction.amount.toFixed(2)} €
                     </div>
                     ${canEdit ? `
                         <div class="transaction-buttons">
                             <button class="btn-edit-transaction" onclick="openEditTransactionModal('${transaction.id}')" title="Modifier">
                                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                 </svg>
                             </button>
                             <button class="btn-delete-transaction" onclick="deleteTransaction('${transaction.id}', this)" title="Supprimer">
                                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                 </svg>
                             </button>
                         </div>
                     ` : ''}
                 </div>
            </div>
        `;
    }).join('');
}

