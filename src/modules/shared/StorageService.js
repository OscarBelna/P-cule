// Structure de données par défaut
export const defaultData = {
    categories: [],
    transactions: [],
    goals: {
        incomeGoal: null,
        categoryBudgets: []
    },
    savingsAllocations: {}
};

// Clé pour le LocalStorage
export const STORAGE_KEY = 'pecule_data';

/**
 * Sauvegarde les données dans le LocalStorage
 * @param {Object} data - Les données à sauvegarder
 */
export function saveData(data) {
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
export function loadData() {
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
                },
                savingsAllocations: data.savingsAllocations || {}
            };
        }
        return defaultData;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return defaultData;
    }
}

