import { loadData, saveData } from '../shared/index.js';

/**
 * Initialise les fonctions de backup et import
 */
export function initBackupImport() {
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
 * @param {string} format - 'json' ou 'txt'
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
 * @param {File} file - Le fichier à importer
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
            
            // Recharger toutes les pages via les callbacks globaux
            if (window.renderCategories) window.renderCategories();
            if (window.renderTransactions) window.renderTransactions();
            if (window.renderCalendar) window.renderCalendar();
            if (window.renderDashboard) window.renderDashboard();
            if (window.renderGoals) window.renderGoals();
            if (window.populateCategorySelect) window.populateCategorySelect();
            
            alert('Données restaurées avec succès !');
            
            // Réinitialiser l'input file
            const importFile = document.getElementById('import-file');
            if (importFile) importFile.value = '';
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

