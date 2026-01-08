import { loadData } from './StorageService.js';

/**
 * Obtient toutes les transactions (y compris récurrentes générées)
 * @returns {Array} Toutes les transactions
 */
export function getAllTransactions() {
    const data = loadData();
    const transactions = [...data.transactions];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Générer les transactions récurrentes
    data.transactions.forEach(transaction => {
        if (transaction.recurrence) {
            const recurrence = typeof transaction.recurrence === 'string' 
                ? { type: transaction.recurrence, endDate: null } // Ancien format
                : transaction.recurrence;
            
            const transactionDate = new Date(transaction.date);
            const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null;
            
            // Déterminer la date maximale (fin de récurrence ou 2 ans dans le futur)
            const maxDate = endDate || new Date(today.getFullYear() + 2, today.getMonth(), 0);
            
            // Générer les occurrences selon le type
            let currentDate = new Date(transactionDate);
            currentDate.setHours(0, 0, 0, 0);
            let occurrenceCount = 0;
            const maxOccurrences = 500; // Limite de sécurité
            
            // Avancer à la première occurrence future (après la date de la transaction originale)
            // On génère seulement les occurrences futures, pas la transaction originale elle-même
            while (currentDate <= maxDate && occurrenceCount < maxOccurrences) {
                // Avancer à la prochaine occurrence selon le type
                switch (recurrence.type) {
                    case 'daily':
                        currentDate.setDate(currentDate.getDate() + 1);
                        break;
                    case 'weekly':
                        currentDate.setDate(currentDate.getDate() + 7);
                        break;
                    case 'bimonthly':
                        currentDate.setDate(currentDate.getDate() + 14); // Toutes les deux semaines
                        break;
                    case 'monthly':
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        break;
                    case 'quarterly':
                        currentDate.setMonth(currentDate.getMonth() + 3);
                        break;
                    case 'yearly':
                        currentDate.setFullYear(currentDate.getFullYear() + 1);
                        break;
                    default:
                        return; // Type inconnu, sortir
                }
                
                // Vérifier si on a dépassé la date de fin
                if (currentDate > maxDate) {
                    break;
                }
                
                const dateStr = currentDate.toISOString().split('T')[0];
                
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
                        id: `${transaction.id}_recurring_${occurrenceCount}`,
                        date: dateStr,
                        originalId: transaction.id,
                        isRecurring: true
                    });
                }
                
                occurrenceCount++;
            }
        }
    });
    
    return transactions;
}

