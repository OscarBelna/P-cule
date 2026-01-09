import { loadData } from './StorageService.js';

/**
 * Remplit un select de catégories de manière générique
 * @param {string} selectId - L'ID de l'élément select à remplir
 * @param {Function} onUpdateCallback - Callback optionnel appelé après la mise à jour
 * @param {string|null} valueToSet - Valeur optionnelle à définir après le remplissage
 */
export function populateCategorySelect(selectId, onUpdateCallback = null, valueToSet = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const data = loadData();
    // Utiliser valueToSet si fourni, sinon utiliser la valeur actuelle du select
    const valueToRestore = valueToSet !== null ? valueToSet : select.value;
    
    select.innerHTML = '';
    
    // Ajouter l'option "Toutes les catégories" en premier
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Toutes les catégories';
    select.appendChild(allOption);
    
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
    
    // Restaurer la valeur sélectionnée si elle existe et est valide
    if (valueToRestore && data.categories.find(cat => cat.id === valueToRestore)) {
        select.value = valueToRestore;
    } else {
        select.value = '';
        // S'assurer que "Toutes les catégories" est sélectionnée
        if (select.options.length > 0 && select.options[0].value === '') {
            select.selectedIndex = 0;
        }
    }
    
    // Appeler le callback si fourni
    if (onUpdateCallback) {
        onUpdateCallback();
    }
}

