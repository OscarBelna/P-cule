import { loadData } from './StorageService.js';

/**
 * Obtient toutes les transactions (y compris récurrentes générées)
 * @returns {Array} Toutes les transactions
 */
export function getAllTransactions() {
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

