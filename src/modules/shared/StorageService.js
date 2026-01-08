// Structure de données par défaut
export const defaultData = {
    categories: [],
    transactions: [],
    goals: {
        incomeGoals: {
            monthly: {}
        },
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
 * Migre les anciennes données vers le nouveau format
 * @param {Object} data - Les données à migrer
 */
function migrateData(data) {
    // Si goals est un tableau, le convertir en objet
    if (Array.isArray(data.goals)) {
        data.goals = {
            incomeGoals: {
                monthly: {}
            },
            categoryBudgets: data.goals.length > 0 ? data.goals : []
        };
    }
    
    // Migration de incomeGoal vers incomeGoals.monthly
    if (data.goals && data.goals.incomeGoal !== undefined && data.goals.incomeGoal !== null) {
        if (!data.goals.incomeGoals) {
            data.goals.incomeGoals = {
                monthly: {}
            };
        }
        if (!data.goals.incomeGoals.monthly) {
            data.goals.incomeGoals.monthly = {};
        }
        
        // Convertir l'ancien incomeGoal en objectif pour le mois en cours
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        data.goals.incomeGoals.monthly[currentMonth] = data.goals.incomeGoal;
        
        // Supprimer l'ancien champ
        delete data.goals.incomeGoal;
    }
    
    // Migration de constant vers monthly (convertir la période en entrées mensuelles)
    if (data.goals && data.goals.incomeGoals && data.goals.incomeGoals.constant) {
        const constant = data.goals.incomeGoals.constant;
        if (constant.startDate && constant.endDate && constant.amount) {
            const startDate = new Date(constant.startDate + '-01');
            const endDate = new Date(constant.endDate + '-01');
            const currentDate = new Date(startDate);
            
            if (!data.goals.incomeGoals.monthly) {
                data.goals.incomeGoals.monthly = {};
            }
            
            // Créer une entrée monthly pour chaque mois de la période
            while (currentDate <= endDate) {
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                // Ne pas écraser une valeur existante si elle est différente
                if (!data.goals.incomeGoals.monthly[monthKey]) {
                    data.goals.incomeGoals.monthly[monthKey] = constant.amount;
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }
        
        // Supprimer constant après migration
        delete data.goals.incomeGoals.constant;
    }
    
    // S'assurer que incomeGoals existe avec la bonne structure
    if (!data.goals) {
        data.goals = {
            incomeGoals: {
                monthly: {}
            },
            categoryBudgets: []
        };
    } else if (!data.goals.incomeGoals) {
        data.goals.incomeGoals = {
            monthly: {}
        };
    } else {
        // S'assurer que monthly existe
        if (!data.goals.incomeGoals.monthly) {
            data.goals.incomeGoals.monthly = {};
        }
        // Supprimer constant s'il existe encore
        if (data.goals.incomeGoals.constant !== undefined) {
            delete data.goals.incomeGoals.constant;
        }
    }
    
    return data;
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
            // Migrer les données si nécessaire
            const migratedData = migrateData(data);
            // S'assurer que toutes les propriétés existent
            const result = {
                categories: migratedData.categories || [],
                transactions: migratedData.transactions || [],
                goals: migratedData.goals || {
                    incomeGoals: {
                        monthly: {}
                    },
                    categoryBudgets: []
                },
                savingsAllocations: migratedData.savingsAllocations || {}
            };
            return result;
        }
        return defaultData;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return defaultData;
    }
}

