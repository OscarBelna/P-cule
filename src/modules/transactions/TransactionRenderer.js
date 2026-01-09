import { getAllTransactions } from '../shared/index.js';
import { loadData } from '../shared/index.js';
import { escapeHtml, parseDateLocal } from '../shared/index.js';

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
    
    // Filtrer les catégories : exclure les catégories d'économie (type === 'savings')
    const transactionCategories = data.categories.filter(category => 
        !category.type || category.type !== 'savings'
    );
    
    // Ajouter les catégories
    transactionCategories.forEach(category => {
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
    if (currentValue && transactionCategories.find(cat => cat.id === currentValue)) {
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
 * @param {number|null} filterMonth - Mois à filtrer (0-11, null pour tous)
 * @param {number|null} filterYear - Année à filtrer (null pour tous)
 * @param {string} filterCategoryId - ID de la catégorie à filtrer ('' pour toutes)
 * @param {string} filterRecurrence - Filtre récurrence ('recurring' pour récurrentes actives uniquement, '' pour toutes)
 */
export function renderTransactions(filterMonth = null, filterYear = null, filterCategoryId = '', filterRecurrence = '') {
    const container = document.getElementById('transactions-container');
    if (!container) return;
    
    const allTransactions = getAllTransactions();
    const data = loadData();
    
    // Filtrer les transactions
    let transactions = allTransactions.filter(transaction => {
        // Inclure toutes les transactions (originales et récurrentes générées)
        // Les transactions récurrentes générées seront affichées pour chaque mois où elles existent
        
        // Filtre par mois/année
        if (filterMonth !== null && filterYear !== null) {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getMonth() !== filterMonth || transactionDate.getFullYear() !== filterYear) {
                return false;
            }
        }
        
        // Filtre par catégorie
        if (filterCategoryId && transaction.categoryId !== filterCategoryId) {
            return false;
        }
        
        // Filtre par récurrence
        // Pour les transactions générées, récupérer la récurrence de la transaction originale
        let transactionRecurrence = transaction.recurrence;
        if (transaction.originalId) {
            const originalTransaction = data.transactions.find(t => t.id === transaction.originalId);
            if (originalTransaction && originalTransaction.recurrence) {
                transactionRecurrence = originalTransaction.recurrence;
            }
        }
        
        if (filterRecurrence === 'recurring') {
            // Afficher uniquement les transactions récurrentes encore actives
            if (!transactionRecurrence) {
                return false;
            }
            
            // Vérifier si la récurrence est encore active
            const recurrence = typeof transactionRecurrence === 'string' 
                ? { type: transactionRecurrence, endDate: null }
                : transactionRecurrence;
            
            if (recurrence.endDate) {
                const endDate = new Date(recurrence.endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (endDate < today) {
                    return false; // Récurrence expirée
                }
            }
        } else if (filterRecurrence === 'recurring-inactive') {
            // Afficher uniquement les transactions récurrentes non actives (expirées)
            if (!transactionRecurrence) {
                return false;
            }
            
            // Vérifier si la récurrence est expirée
            const recurrence = typeof transactionRecurrence === 'string' 
                ? { type: transactionRecurrence, endDate: null }
                : transactionRecurrence;
            
            if (!recurrence.endDate) {
                return false; // Pas de date de fin = toujours active
            }
            
            const endDate = new Date(recurrence.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (endDate >= today) {
                return false; // Récurrence encore active
            }
        }
        
        return true;
    });
    
    // Grouper les transactions récurrentes journalières, hebdomadaires et bimensuelles par mois
    const groupedTransactions = [];
    const processedGroups = new Map(); // Pour éviter les doublons
    
    transactions.forEach(transaction => {
        const isRecurringGenerated = transaction.isRecurring || transaction.originalId;
        
        if (isRecurringGenerated) {
            // Récupérer la transaction originale pour obtenir le type de récurrence
            const originalTransaction = data.transactions.find(t => t.id === (transaction.originalId || transaction.id));
            if (originalTransaction && originalTransaction.recurrence) {
                const recurrence = typeof originalTransaction.recurrence === 'string' 
                    ? { type: originalTransaction.recurrence, endDate: null }
                    : originalTransaction.recurrence;
                
                // Grouper uniquement pour daily, weekly, bimonthly
                if (recurrence.type === 'daily' || recurrence.type === 'weekly' || recurrence.type === 'bimonthly') {
                    const transactionDate = new Date(transaction.date);
                    const monthKey = `${transactionDate.getMonth()}-${transactionDate.getFullYear()}-${transaction.originalId || transaction.id}`;
                    
                    if (!processedGroups.has(monthKey)) {
                        // Trouver toutes les transactions de ce groupe dans le même mois
                        const sameMonthTransactions = transactions.filter(t => {
                            if (!t.isRecurring && !t.originalId) return false;
                            const tDate = new Date(t.date);
                            const sameOriginal = (t.originalId || t.id) === (transaction.originalId || transaction.id);
                            return sameOriginal && 
                                   tDate.getMonth() === transactionDate.getMonth() && 
                                   tDate.getFullYear() === transactionDate.getFullYear();
                        });
                        
                        if (sameMonthTransactions.length > 1) {
                            // Calculer le total
                            const total = sameMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
                            const count = sameMonthTransactions.length;
                            
                            // Créer une transaction groupée
                            const groupedTransaction = {
                                ...transaction,
                                isGrouped: true,
                                groupedCount: count,
                                groupedTotal: total,
                                groupedTransactions: sameMonthTransactions
                            };
                            
                            groupedTransactions.push(groupedTransaction);
                            processedGroups.set(monthKey, true);
                            return; // Ne pas ajouter la transaction individuelle
                        }
                    } else {
                        return; // Déjà traité dans un groupe
                    }
                }
            }
        }
        
        // Ajouter la transaction normale (non groupée)
        groupedTransactions.push(transaction);
    });
    
    transactions = groupedTransactions;
    
    // Trier par date (plus récent en premier)
    transactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    // Limiter à 20 transactions si aucun filtre de mois n'est appliqué
    const totalTransactions = transactions.length;
    if (filterMonth === null && filterYear === null) {
        transactions = transactions.slice(0, 20);
    }
    
    if (transactions.length === 0) {
        let message = 'Aucune transaction pour le moment';
        let subMessage = 'Ajoutez votre première transaction ci-dessus';
        
        // Personnaliser le message selon les filtres actifs
        if (filterMonth !== null || filterCategoryId || filterRecurrence) {
            message = 'Aucune transaction trouvée';
            subMessage = 'Essayez de modifier les filtres pour voir plus de résultats';
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>${message}</p>
                <p style="font-size: 14px; margin-top: 8px;">${subMessage}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(transaction => {
        const category = data.categories.find(cat => cat.id === transaction.categoryId);
        const categoryColor = category ? category.color : '#64748b';
        const categoryName = category ? category.name : 'Catégorie supprimée';
        const isIncome = transaction.amount > 0;
        const date = parseDateLocal(transaction.date);
        const formattedDate = date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Permettre la modification pour toutes les transactions
        // Pour les transactions récurrentes générées, on modifiera la transaction originale
        const canEdit = true;
        
        // Pour les transactions récurrentes générées, on peut afficher un indicateur
        const isGeneratedRecurring = transaction.isRecurring || transaction.originalId;
        
        // Vérifier si la récurrence est active ou inactive
        // Pour les transactions générées, récupérer la récurrence de la transaction originale
        let recurrenceStatusBadge = '';
        let transactionRecurrence = transaction.recurrence;
        
        if (transaction.originalId) {
            // Si c'est une transaction générée, récupérer la récurrence de l'originale
            const originalTransaction = data.transactions.find(t => t.id === transaction.originalId);
            if (originalTransaction && originalTransaction.recurrence) {
                transactionRecurrence = originalTransaction.recurrence;
            }
        }
        
        if (transactionRecurrence) {
            const recurrence = typeof transactionRecurrence === 'string' 
                ? { type: transactionRecurrence, endDate: null }
                : transactionRecurrence;
            
            const isActive = !recurrence.endDate || new Date(recurrence.endDate) >= new Date();
            const statusIcon = isActive ? '🟢' : '🔴';
            const statusText = isActive ? 'Active' : 'Inactive';
            recurrenceStatusBadge = `<span class="recurrence-status-badge ${isActive ? 'active' : 'inactive'}" title="Récurrence ${statusText.toLowerCase()}">${statusIcon}</span>`;
        }
        
        // Pour les transactions récurrentes générées, utiliser l'ID de la transaction originale pour l'édition
        const transactionIdForEdit = isGeneratedRecurring && transaction.originalId ? transaction.originalId : transaction.id;
        
        // Gérer les transactions groupées
        const isGrouped = transaction.isGrouped;
        const displayAmount = isGrouped ? transaction.groupedTotal : transaction.amount;
        const displayIsIncome = displayAmount > 0;
        const recurrenceLabel = transactionRecurrence ? getRecurrenceLabel(transactionRecurrence) : '';
        
        // Calculer le texte du calcul pour les transactions groupées
        let calculationText = '';
        if (isGrouped && transactionRecurrence) {
            const singleAmount = Math.abs(transaction.groupedTotal / transaction.groupedCount);
            calculationText = ` (${singleAmount.toFixed(2)} € × ${transaction.groupedCount} = ${Math.abs(displayAmount).toFixed(2)} €)`;
        }
        
        // Formater la date pour les transactions groupées
        let displayDate = formattedDate;
        if (isGrouped) {
            const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            displayDate = `${monthNames[date.getMonth()]} ${date.getFullYear()} (${transaction.groupedCount} occurrences)`;
        }
        
        return `
            <div class="transaction-item ${displayIsIncome ? 'income' : 'expense'} ${isGeneratedRecurring ? 'recurring-generated' : ''} ${isGrouped ? 'grouped-recurring' : ''}">
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-category-badge" style="background-color: ${categoryColor}"></span>
                        <span class="transaction-category-name">${escapeHtml(categoryName)}</span>
                        ${transactionRecurrence ? `<span class="transaction-recurring-badge">🔄 ${recurrenceLabel}${calculationText}${recurrenceStatusBadge}</span>` : ''}
                        ${isGeneratedRecurring ? '<span class="recurring-generated-badge" title="Transaction générée automatiquement">⚡</span>' : ''}
                    </div>
                    ${transaction.description ? `<div class="transaction-description">${escapeHtml(transaction.description)}</div>` : ''}
                    <div class="transaction-date">${displayDate}</div>
                </div>
                 <div class="transaction-actions-amount">
                     <div class="transaction-amount ${displayIsIncome ? 'income' : 'expense'}">
                         ${displayIsIncome ? '+' : ''}${displayAmount.toFixed(2)} €
                     </div>
                     ${canEdit ? `
                         <div class="transaction-buttons">
                             <button class="btn-edit-transaction" onclick="openEditTransactionModal('${transactionIdForEdit}')" title="Modifier">
                                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                 </svg>
                             </button>
                             <button class="btn-delete-transaction" onclick="deleteTransaction('${transactionIdForEdit}', this)" title="Supprimer">
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

